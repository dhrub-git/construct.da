/**
 * @file parser.ts
 * Parsing layer: transforms raw OCR pages into a structured document model.
 *
 * Strategy:
 *  1. Strip repeated headers/footers (noise from every page)
 *  2. Detect TOC page(s) and extract entries
 *  3. Detect hierarchical headings via regex + heuristic scoring
 *  4. Stitch multi-page continuations
 *  5. Repair broken OCR paragraphs
 *  6. Flag low-confidence and anomalous pages
 */

import type {
    DetectedHeading,
    DocumentStructure,
    HeadingLevel,
    TOCEntry,
} from "@models/types";
import type { OCRPageObject, OCRResponse } from "@mistralai/mistralai/models/components";

// ─── Heading Patterns ──────────────────────────────────────────────────────────
// Ordered from most-specific to least-specific.
// Each pattern captures: [full match, number?, heading text]

const HEADING_PATTERNS: Array<{
    regex: RegExp;
    level: HeadingLevel;
    weight: number; // confidence weight
}> = [
        // "Part 1 - Preliminary" / "PART 1 PRELIMINARY"
        {
            regex: /^(?:PART|Part)\s+(\d+[A-Z]?)\s*[-–—:]?\s*(.+)$/m,
            level: "part",
            weight: 1.0,
        },
        // "Division 2 Residential Zones"
        {
            regex: /^(?:DIVISION|Division)\s+(\d+[A-Z]?)\s*[-–—:]?\s*(.+)$/m,
            level: "division",
            weight: 1.0,
        },
        // "Subdivision 1"
        {
            regex: /^(?:SUBDIVISION|Subdivision)\s+(\d+[A-Z]?)\s*[-–—:]?\s*(.*)$/m,
            level: "subdivision",
            weight: 0.9,
        },
        // "Schedule 1 — Additional Permitted Uses"
        {
            regex:
                /^(?:SCHEDULE|Schedule)\s+(\d+[A-Z]?)\s*[-–—:]?\s*(.+)$/m,
            level: "schedule",
            weight: 1.0,
        },
        // "Appendix A"
        {
            regex: /^(?:APPENDIX|Appendix)\s+([A-Z\d]+)\s*[-–—:]?\s*(.*)$/m,
            level: "appendix",
            weight: 0.95,
        },
        // Numbered clause: "4.3  Height of Buildings" (dot or space separator)
        {
            regex: /^(\d{1,2}(?:\.\d{1,2}){0,3})\s{2,}(.{3,80})$/m,
            level: "clause",
            weight: 0.85,
        },
        // Lettered subclause: "(a)" or "(1)" — lower weight, context-dependent
        {
            regex: /^\(([a-z]|\d+)\)\s+(.+)$/m,
            level: "subclause",
            weight: 0.4,
        },
        // Chapter (less common in NSW LEP but present in some instruments)
        {
            regex: /^(?:CHAPTER|Chapter)\s+(\d+[A-Z]?)\s*[-–—:]?\s*(.+)$/m,
            level: "chapter",
            weight: 1.0,
        },
    ];

// TOC line: "4.3  Height of buildings .......... 12"
const TOC_LINE_RE =
    /^(\d{1,2}(?:\.\d{1,2}){0,3})\s{2,}(.+?)\s*\.{2,}\s*(\d+)\s*$/;

// TOC heading-only line (no page number — some documents omit them)
const TOC_HEADING_LINE_RE =
    /^(?:Part|Division|Subdivision|Schedule|Appendix)\s+\d+/i;

// Clause reference in body text: "clause 4.3", "cl 4.3", "Schedule 2"
const CROSS_REF_RE =
    /\b(?:clause|cl\.|section|sch(?:edule)?|appendix|part|division)\s+(\d+[A-Z]?(?:\.\d+)*)/gi;

// Zone codes: "R2 Low Density Residential", "IN1 General Industrial"
const ZONE_CODE_RE =
    /\b([A-Z]{1,3}\d{1,2}(?:\s+[A-Z][a-z]+){1,4})\b/g;

// Definition pattern: **"term"** means ... / "term" has the same meaning ...
const DEFINITION_RE =
    /^["""*]{0,2}([A-Za-z][\w\s-]{1,60})["""*]{0,2}\s+(?:means|has the same meaning|includes|refers to)/m;

// ─── Header/Footer Normalisation ──────────────────────────────────────────────

/**
 * Find text that appears on ≥60% of pages — treat as a repeating header/footer.
 * Returns a set of normalised strings to strip.
 */
function detectRepeatedPageText(pages: OCRPageObject[]): Set<string> {
    const freq = new Map<string, number>();
    const threshold = Math.max(3, Math.floor(pages.length * 0.6));

    for (const page of pages) {
        const candidates = [
            page.header?.trim(),
            page.footer?.trim(),
            // Also check the first and last non-empty line of markdown
            firstNonEmptyLine(page.markdown),
            lastNonEmptyLine(page.markdown),
        ].filter(Boolean) as string[];

        const seen = new Set<string>();
        for (const c of candidates) {
            const normalised = normaliseHeaderText(c);
            if (normalised.length > 3 && !seen.has(normalised)) {
                seen.add(normalised);
                freq.set(normalised, (freq.get(normalised) ?? 0) + 1);
            }
        }
    }

    const repeated = new Set<string>();
    for (const [text, count] of freq) {
        if (count >= threshold) repeated.add(text);
    }
    return repeated;
}

function normaliseHeaderText(text: string): string {
    // Remove page numbers, dates, and whitespace variance
    return text
        .replace(/\b(?:page|p\.?)\s*\d+\s*(?:of\s*\d+)?/gi, "")
        .replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function firstNonEmptyLine(md: string): string {
    return md.split("\n").find((l) => l.trim().length > 3)?.trim() ?? "";
}

function lastNonEmptyLine(md: string): string {
    const lines = md.split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim().length > 3) return lines[i].trim();
    }
    return "";
}

/**
 * Strip repeated header/footer text from a page's markdown.
 */
function stripRepeatedText(
    markdown: string,
    repeated: Set<string>
): string {
    if (repeated.size === 0) return markdown;

    const lines = markdown.split("\n");
    const filtered = lines.filter((line) => {
        const norm = normaliseHeaderText(line);
        return norm.length === 0 || !repeated.has(norm);
    });
    return filtered.join("\n");
}

// ─── TOC Detection ────────────────────────────────────────────────────────────

/**
 * Heuristic: a page is a TOC page if it has ≥4 TOC-formatted lines
 * and the total prose content is low.
 */
function isTOCPage(page: OCRPageObject): boolean {
    const lines = page.markdown.split("\n");
    let tocLines = 0;
    let totalContentLines = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length < 3) continue;
        totalContentLines++;
        if (TOC_LINE_RE.test(trimmed) || TOC_HEADING_LINE_RE.test(trimmed)) {
            tocLines++;
        }
    }

    return totalContentLines > 0 && tocLines / totalContentLines > 0.35;
}

function parseTOCPage(page: OCRPageObject): TOCEntry[] {
    const entries: TOCEntry[] = [];
    const lines = page.markdown.split("\n");

    for (const line of lines) {
        const trimmed = line.trim();

        // Numbered entry with page ref
        const m = trimmed.match(TOC_LINE_RE);
        if (m) {
            entries.push({
                text: m[2].replace(/\.+$/, "").trim(),
                number: m[1],
                pageRef: parseInt(m[3], 10),
                level: inferHeadingLevelFromNumber(m[1]),
            });
            continue;
        }

        // Heading-only TOC line (Part / Division)
        const hm = trimmed.match(
            /^(Part|Division|Subdivision|Schedule|Appendix)\s+(\d+[A-Z]?)\s*[-–—]?\s*(.*)/i
        );
        if (hm) {
            entries.push({
                text: hm[3].trim() || `${hm[1]} ${hm[2]}`,
                number: `${hm[1]} ${hm[2]}`,
                level: hm[1].toLowerCase() as HeadingLevel,
            });
        }
    }

    return entries;
}

function inferHeadingLevelFromNumber(num: string): HeadingLevel {
    const dots = (num.match(/\./g) ?? []).length;
    if (dots === 0) return "clause";
    if (dots === 1) return "clause";
    if (dots >= 2) return "subclause";
    return "unknown";
}

// ─── Heading Detection ────────────────────────────────────────────────────────

function detectHeadingsOnPage(
    page: OCRPageObject,
    pageText: string
): DetectedHeading[] {
    const headings: DetectedHeading[] = [];

    for (const { regex, level } of HEADING_PATTERNS) {
        // Reset lastIndex for global regexes
        const globalRe = new RegExp(regex.source, "gm");
        let match: RegExpExecArray | null;

        while ((match = globalRe.exec(pageText)) !== null) {
            // Skip very short matches — likely OCR artifacts
            const matchedText = match[0].trim();
            if (matchedText.length < 4) continue;

            const number = match[1]?.trim();
            const text = (match[2] ?? match[1] ?? matchedText).trim();

            // De-duplicate: don't add if identical heading already captured
            const isDupe = headings.some(
                (h) =>
                    h.pageIndex === page.index &&
                    normaliseHeaderText(h.text) === normaliseHeaderText(text)
            );
            if (isDupe) continue;

            headings.push({
                text,
                level,
                number,
                pageIndex: page.index,
                lineOffset: match.index,
                rawMatch: matchedText,
            });
        }
    }

    // Sort by position in text
    headings.sort((a, b) => a.lineOffset - b.lineOffset);
    return headings;
}

// ─── Broken Paragraph Repair ──────────────────────────────────────────────────

/**
 * OCR frequently breaks paragraphs mid-sentence at page edges.
 * Heuristics:
 *  - Line ends without sentence-ending punctuation AND
 *  - Next line starts lowercase or with a connector word
 *  - Not a heading line (would start with uppercase keyword or number)
 */
function repairBrokenParagraphs(text: string): string {
    const lines = text.split("\n");
    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const current = lines[i];
        const next = lines[i + 1];

        if (!next) {
            result.push(current);
            continue;
        }

        const currentTrimmed = current.trimEnd();
        const nextTrimmed = next.trimStart();

        const endsWithBreak =
            currentTrimmed.length > 0 &&
            !/[.!?;:""»]$/.test(currentTrimmed) &&
            !/[-–—]$/.test(currentTrimmed); // not a hyphen-split word

        const nextIsLower =
            nextTrimmed.length > 0 && /^[a-z(]/.test(nextTrimmed);

        const nextIsConnector =
            /^(?:and|or|but|the|a |an |in |of |to |for |that|which|who|as |at |by |on |is |are |was |were |has |have |had )/i.test(
                nextTrimmed
            );

        const nextIsHeading = HEADING_PATTERNS.some(({ regex }) =>
            regex.test(nextTrimmed)
        );

        if (
            endsWithBreak &&
            (nextIsLower || nextIsConnector) &&
            !nextIsHeading
        ) {
            // Merge: append next line, handling hyphenation
            if (currentTrimmed.endsWith("-")) {
                result.push(currentTrimmed.slice(0, -1) + nextTrimmed);
            } else {
                result.push(currentTrimmed + " " + nextTrimmed);
            }
            i++; // skip next line (already merged)
        } else {
            result.push(current);
        }
    }

    return result.join("\n");
}

// ─── Cross-Reference Extraction ───────────────────────────────────────────────

function extractCrossReferences(text: string): string[] {
    const refs: string[] = [];
    const re = new RegExp(CROSS_REF_RE.source, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        refs.push(m[0].trim());
    }
    return [...new Set(refs)];
}

// ─── Zone Extraction ──────────────────────────────────────────────────────────

function extractZoneCodes(text: string): string[] {
    const zones: string[] = [];
    const re = new RegExp(ZONE_CODE_RE.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        // Basic sanity: code starts with 1-3 uppercase letters + digit
        if (/^[A-Z]{1,3}\d/.test(m[1])) {
            zones.push(m[1].trim());
        }
    }
    return [...new Set(zones)];
}

// ─── Main Parse Function ───────────────────────────────────────────────────────

/**
 * parseOCRDocument
 *
 * Transforms raw OCR output into a cleaned, structured page array
 * plus a document-level structure model.
 *
 * @param ocr - Raw OCR response
 * @returns Cleaned pages and detected document structure
 */
export function parseOCRDocument(ocr: OCRResponse): {
    cleanedPages: Array<{ page: OCRPageObject; cleanedMarkdown: string }>;
    structure: DocumentStructure;
} {
    // 1. Detect repeating header/footer noise
    const repeatedText = detectRepeatedPageText(ocr.pages);

    // 2. First pass: clean each page
    const cleanedPages = ocr.pages.map((page) => {
        let markdown = page.markdown ?? "";

        // Strip OCR header/footer artifacts
        markdown = stripRepeatedText(markdown, repeatedText);

        // Repair broken OCR paragraphs within each page
        markdown = repairBrokenParagraphs(markdown);

        // Normalise whitespace runs (but preserve intentional blank lines)
        markdown = markdown
            .replace(/[ \t]{2,}/g, " ")          // collapse inline spaces
            .replace(/\n{3,}/g, "\n\n")           // max 2 consecutive blank lines
            .trim();

        return { page, cleanedMarkdown: markdown };
    });

    // 3. Detect document structure
    const structure = detectStructure(
        cleanedPages,
        repeatedText
    );

    return { cleanedPages, structure };
}

/**
 * detectStructure
 *
 * Analyses all cleaned pages to build the document's structural model:
 * TOC entries, heading hierarchy, content flags.
 */
export function detectStructure(
    cleanedPages: Array<{ page: OCRPageObject; cleanedMarkdown: string }>,
    repeatedText?: Set<string>
): DocumentStructure {
    const toc: TOCEntry[] = [];
    const headings: DetectedHeading[] = [];

    let hasNumberedClauses = false;
    let hasZones = false;
    let hasDefinitions = false;
    let hasSchedules = false;

    // Infer document type from repeated header (often contains doc name)
    let repeatedHeaderPattern: string | undefined;
    let repeatedFooterPattern: string | undefined;
    if (repeatedText) {
        const arr = [...repeatedText];
        repeatedHeaderPattern = arr[0];
        repeatedFooterPattern = arr[1];
    }

    for (const { page, cleanedMarkdown } of cleanedPages) {
        // TOC detection
        if (isTOCPage(page)) {
            toc.push(...parseTOCPage(page));
            continue; // skip heading detection on TOC pages
        }

        // Heading detection
        const pageHeadings = detectHeadingsOnPage(page, cleanedMarkdown);
        headings.push(...pageHeadings);

        // Content flags
        if (!hasNumberedClauses && /^\d{1,2}\.\d{1,2}/m.test(cleanedMarkdown)) {
            hasNumberedClauses = true;
        }
        if (!hasZones && ZONE_CODE_RE.test(cleanedMarkdown)) {
            hasZones = true;
        }
        if (!hasDefinitions && DEFINITION_RE.test(cleanedMarkdown)) {
            hasDefinitions = true;
        }
        if (
            !hasSchedules &&
            /^(?:SCHEDULE|Schedule)\s+\d/m.test(cleanedMarkdown)
        ) {
            hasSchedules = true;
        }
    }

    // Infer document type from TOC / headings if not supplied in metadata
    const documentType = inferDocumentType(headings, toc);

    return {
        toc,
        headings,
        hasNumberedClauses,
        hasZones,
        hasDefinitions,
        hasSchedules,
        documentType,
        repeatedHeaderPattern,
        repeatedFooterPattern,
    };
}

function inferDocumentType(
    headings: DetectedHeading[],
    toc: TOCEntry[]
): string {
    const allText = [
        ...headings.map((h) => h.text),
        ...toc.map((t) => t.text),
    ]
        .join(" ")
        .toLowerCase();

    if (allText.includes("local environmental plan")) return "LEP";
    if (allText.includes("development control plan")) return "DCP";
    if (allText.includes("state environmental planning")) return "SEPP";
    if (allText.includes("biodiversity")) return "Biodiversity";
    if (allText.includes("growth centres")) return "Growth Centres";
    return "Planning Instrument";
}

// Export helpers for use in other modules
export {
    extractCrossReferences,
    extractZoneCodes,
    DEFINITION_RE,
    ZONE_CODE_RE,
};