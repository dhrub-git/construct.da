/**
 * @file chunker.ts
 * Semantic chunking engine.
 *
 * Chunking philosophy:
 *  - One clause = one chunk (natural legal unit)
 *  - Large clause → child chunks with token overlap
 *  - Table → dedicated structured chunk
 *  - Image/diagram → metadata-only chunk (content = caption)
 *  - Definitions section → individual definition chunks
 *  - Schedule → section-level chunks
 *  - Multi-page content → stitched before chunking
 *  - Every chunk carries its full heading breadcrumb
 *
 * Token estimation: ~0.75 tokens per character (conservative for legal prose)
 */

import type {
  DetectedHeading,
  DocumentStructure,
  SemanticChunk,
  ChunkMetadata,
  SectionType,
  HeadingLevel,
  IngestionConfig,
  RuleFilePrisma,
  RuleFileMetadata,
} from "@models/types";

import {
  extractCrossReferences,
  extractZoneCodes,
  // DEFINITION_RE,
} from "./parser";
import type { OCRImageObject, OCRPageObject, OCRTableObject } from "@mistralai/mistralai/models/components";
import { FilesStrict } from "@/types/data";

// ─── Token Estimation ─────────────────────────────────────────────────────────

const CHARS_PER_TOKEN = 4; // conservative for legal/regulatory text

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

// ─── Text Keyword Extraction ──────────────────────────────────────────────────

/**
 * Extract domain-specific keywords for FTS enrichment.
 * Targets planning/legal terminology common in Australian instruments.
 */
function extractKeywords(text: string): string[] {
  const LEGAL_TERMS = new Set([
    "permitted with consent",
    "permitted without consent",
    "prohibited",
    "land use",
    "floor space ratio",
    "fsr",
    "height of buildings",
    "lot size",
    "minimum lot size",
    "environmental protection",
    "heritage conservation",
    "biodiversity",
    "acid sulfate soils",
    "flood planning",
    "bush fire",
    "riparian land",
    "scenic protection",
    "foreshore",
    "development consent",
    "integrated development",
    "exempt development",
    "complying development",
    "principal development standards",
    "local provisions",
    "subdivision",
    "strata",
    "mixed use",
  ]);

  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const term of LEGAL_TERMS) {
    if (lower.includes(term)) {
      found.push(term);
    }
  }

  // Also extract capitalised multi-word phrases (likely proper terms)
  const phraseRe = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})\b/g;
  let m: RegExpExecArray | null;
  while ((m = phraseRe.exec(text)) !== null) {
    const phrase = m[1].toLowerCase();
    if (phrase.length > 5 && !found.includes(phrase)) {
      found.push(phrase);
    }
  }

  return [...new Set(found)].slice(0, 30); // cap at 30 keywords
}

// ─── Heading Breadcrumb Stack ─────────────────────────────────────────────────

/**
 * Maintains the current heading path as we traverse pages.
 * Higher-level headings replace lower-level ones at the same depth.
 */
class HeadingStack {
  private static readonly LEVEL_ORDER: HeadingLevel[] = [
    "chapter",
    "part",
    "division",
    "subdivision",
    "schedule",
    "appendix",
    "section",
    "clause",
    "subclause",
    "unknown",
  ];

  private stack: Array<{ level: HeadingLevel; label: string }> = [];

  push(heading: DetectedHeading): void {
    const newDepth = HeadingStack.LEVEL_ORDER.indexOf(heading.level);
    const label = heading.number
      ? `${this.capitalise(heading.level)} ${heading.number}: ${heading.text}`
      : heading.text;

    // Pop anything at the same or deeper level
    this.stack = this.stack.filter(({ level }) => {
      const depth = HeadingStack.LEVEL_ORDER.indexOf(level);
      return depth < newDepth;
    });

    this.stack.push({ level: heading.level, label });
  }

  getBreadcrumb(): string[] {
    return this.stack.map((s) => s.label);
  }

  getCurrentClause(): string | null {
    // Walk backwards to find the deepest clause/subclause
    for (let i = this.stack.length - 1; i >= 0; i--) {
      if (
        this.stack[i].level === "clause" ||
        this.stack[i].level === "subclause" ||
        this.stack[i].level === "section"
      ) {
        return this.stack[i].label;
      }
    }
    return null;
  }

  getCurrentZone(): string | null {
    const breadcrumb = this.getBreadcrumb().join(" ");
    const zoneMatch = breadcrumb.match(/\b([A-Z]{1,3}\d{1,2})\b/);
    return zoneMatch ? zoneMatch[1] : null;
  }

  private capitalise(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

// ─── Chunk Splitting (Large Clauses) ─────────────────────────────────────────

/**
 * Split oversized text into overlapping child chunks.
 * Splits on sentence boundaries where possible.
 */
function splitIntoChildChunks(
  text: string,
  maxTokens: number,
  overlapTokens: number
): string[] {
  if (estimateTokens(text) <= maxTokens) return [text];

  // Try to split on sentence boundaries
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  let overlapBuffer = "";

  for (const sentence of sentences) {
    const candidate = current ? current + " " + sentence : sentence;

    if (estimateTokens(candidate) > maxTokens && current) {
      chunks.push(current.trim());
      // Carry overlap from tail of current chunk
      overlapBuffer = extractOverlap(current, overlapTokens);
      current = overlapBuffer + " " + sentence;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) chunks.push(current.trim());

  return chunks.length > 0 ? chunks : [text];
}

function extractOverlap(text: string, overlapTokens: number): string {
  const chars = overlapTokens * CHARS_PER_TOKEN;
  const tail = text.slice(-chars);
  // Start at a word boundary
  const firstSpace = tail.indexOf(" ");
  return firstSpace > 0 ? tail.slice(firstSpace + 1) : tail;
}

// ─── OCR Quality Helpers ─────────────────────────────────────────────────────

function avgConfidence(
  pages: OCRPageObject[],
  start: number,
  end: number
): number | undefined {
  const relevant = pages.slice(start, end + 1).filter(
    (p) => p.confidenceScores != null
  );
  if (relevant.length === 0) return undefined;
  const sum = relevant.reduce(
    (acc, p) => acc + (p.confidenceScores!.averagePageConfidenceScore ?? 0),
    0
  );
  return Math.round((sum / relevant.length) * 100) / 100;
}

function ocrWarningsForPages(
  pages: OCRPageObject[],
  start: number,
  end: number
): string[] {
  const warnings: string[] = [];
  for (const page of pages.slice(start, end + 1)) {
    const score = page.confidenceScores?.averagePageConfidenceScore;
    if (score != null && score < 0.7) {
      warnings.push(`low_confidence_page_${page.index + 1}`);
    }
    // Detect sideways/rotated pages heuristically
    const dims = page.dimensions;
    if (dims && dims.width > dims.height * 1.5) {
      warnings.push(`possible_landscape_page_${page.index + 1}`);
    }
  }
  return warnings;
}

// ─── Metadata Normalisation ───────────────────────────────────────────────────

/**
 * normalizeChunkMetadata
 *
 * Builds the final ChunkMetadata from a partial draft, enriching with
 * extracted keywords, references, zone codes, and quality signals.
 */
export function normalizeChunkMetadata(
  draft: Omit<ChunkMetadata, "keywords" | "references" | "wordCount">,
  content: string,
  pages: OCRPageObject[]
): ChunkMetadata {
  const references = extractCrossReferences(content);
  const zoneCodes = extractZoneCodes(content);
  const keywords = extractKeywords(content);

  // Merge extracted zones into the existing zone field
  const zoneCode =
    draft.zoneCode ?? (zoneCodes.length > 0 ? zoneCodes[0] : undefined);

  // Add zone codes as synonyms for FTS
  const synonyms = [...new Set([...zoneCodes, ...(draft.synonyms ?? [])])];

  const confidenceScore = avgConfidence(
    pages,
    draft.pageStart - 1,
    draft.pageEnd - 1
  );
  const ocrWarnings = ocrWarningsForPages(
    pages,
    draft.pageStart - 1,
    draft.pageEnd - 1
  );

  return {
    ...draft,
    zoneCode,
    synonyms,
    keywords,
    references,
    wordCount: content.split(/\s+/).filter(Boolean).length,
    confidenceScore,
    ocrWarnings: ocrWarnings.length > 0 ? ocrWarnings : undefined,
    extractedFromOCR: true,
  };
}

// ─── Main Chunking Function ───────────────────────────────────────────────────

/**
 * buildSemanticChunks
 *
 * Core chunking algorithm. Traverses cleaned pages, maintaining heading
 * context, and emits semantic chunks at logical document boundaries.
 *
 * Algorithm:
 *  1. Walk pages sequentially
 *  2. For each page, split into segments at heading boundaries
 *  3. Detect segment type (clause, table, definition, image, etc.)
 *  4. Buffer multi-page continuations until a new heading appears
 *  5. When flushing a buffer, split if oversize, maintaining overlap
 *  6. Attach full heading breadcrumb and metadata to each chunk
 */
export function buildSemanticChunks(
  cleanedPages: Array<{ page: OCRPageObject; cleanedMarkdown: string }>,
  structure: DocumentStructure,
  fileRecord: RuleFilePrisma | FilesStrict,
  config: IngestionConfig
): SemanticChunk[] {
  const chunks: SemanticChunk[] = [];
  const headingStack = new HeadingStack();
  const meta = fileRecord.metadata as RuleFileMetadata;

  // Build a lookup of headings per page for fast access
  const headingsByPage = new Map<number, DetectedHeading[]>();
  for (const h of structure.headings) {
    const existing = headingsByPage.get(h.pageIndex) ?? [];
    existing.push(h);
    headingsByPage.set(h.pageIndex, existing);
  }

  // Buffer for accumulating content that spans multiple pages
  interface ContentBuffer {
    content: string;
    sectionType: SectionType;
    pageStart: number;
    pageEnd: number;
    headingPath: string[];
    clauseNumber?: string;
    isDefinitionSection: boolean;
    isTocSection: boolean;
  }

  let buffer: ContentBuffer | null = null;

  const flushBuffer = (isContinuedByNext: boolean) => {
    if (!buffer || buffer.content.trim().length === 0) return;
    if (estimateTokens(buffer.content) < config.minChunkTokens) {
      buffer = null;
      return;
    }

    const baseClause = buffer.clauseNumber ?? null;
    const baseZone = headingStack.getCurrentZone();

    // Handle definition sections: emit one chunk per definition
    if (buffer.isDefinitionSection) {
      const defChunks = splitDefinitions(buffer.content);
      for (const defChunk of defChunks) {
        if (estimateTokens(defChunk.content) < config.minChunkTokens)
          continue;

        const chunkIndex = chunks.length;
        const metaDraft: Omit<ChunkMetadata, "keywords" | "references" | "wordCount"> = {
          fileName: fileRecord.name,
          documentType: meta?.type ?? structure.documentType,
          state: meta?.state ?? "",
          council: meta?.council,
          country: meta?.country ?? "Australia",
          legislationUrl: meta?.legislationUrl,
          sourcePage: meta?.sourcePage,
          etag: meta?.etag ?? "",
          pageStart: buffer.pageStart,
          pageEnd: buffer.pageEnd,
          headingPath: buffer.headingPath,
          sectionType: "definition",
          clauseNumber: baseClause ?? undefined,
          definitionTerm: defChunk.term ?? undefined,
          continuedFromPrevious: false,
          continuesToNext: false,
          tocMatched: isTOCMatched(buffer.headingPath, structure),
          extractedFromOCR: true,
          chunkDepth: 0,
          hasTable: false,
          hasImage: false,
        };

        chunks.push({
          fileId: fileRecord.id,
          chunkIndex,
          pageNumber: buffer.pageStart,
          title: defChunk.term ? `Definition: ${defChunk.term}` : null,
          content: defChunk.content,
          source: meta?.pdfUrl ?? null,
          clause: baseClause,
          zone: baseZone,
          topic: "Definitions",
          metadata: normalizeChunkMetadata(
            metaDraft,
            defChunk.content,
            cleanedPages.map((c) => c.page)
          ),
        });
      }

      buffer = null;
      return;
    }

    // Split if content exceeds max token budget
    const textChunks = splitIntoChildChunks(
      buffer.content,
      config.maxChunkTokens,
      config.overlapTokens
    );

    const isMultiChild = textChunks.length > 1;
    const parentIndex = isMultiChild ? chunks.length : undefined;

    for (let ci = 0; ci < textChunks.length; ci++) {
      const text = textChunks[ci];
      const chunkIndex = chunks.length;
      const isFirst = ci === 0;
      const isLast = ci === textChunks.length - 1;

      const metaDraft: Omit<ChunkMetadata, "keywords" | "references" | "wordCount"> = {
        fileName: fileRecord.name,
        documentType: meta?.type ?? structure.documentType,
        state: meta?.state ?? "",
        council: meta?.council,
        country: meta?.country ?? "Australia",
        legislationUrl: meta?.legislationUrl,
        sourcePage: meta?.sourcePage,
        etag: meta?.etag ?? "",
        pageStart: buffer!.pageStart,
        pageEnd: buffer!.pageEnd,
        headingPath: buffer!.headingPath,
        sectionType: buffer!.sectionType,
        clauseNumber: baseClause ?? undefined,
        zoneCode: baseZone ?? undefined,
        continuedFromPrevious: !isFirst,
        continuesToNext: !isLast || isContinuedByNext,
        tocMatched: isTOCMatched(buffer!.headingPath, structure),
        extractedFromOCR: true,
        chunkDepth: isMultiChild ? 1 : 0,
        parentChunkId: isMultiChild ? String(parentIndex) : undefined,
        siblingIndex: isMultiChild ? ci : undefined,
        totalSiblings: isMultiChild ? textChunks.length : undefined,
        hasTable: false,
        hasImage: false,
      };

      const clauseLabel = baseClause ?? extractClauseFromPath(buffer!.headingPath);

      chunks.push({
        fileId: fileRecord.id,
        chunkIndex,
        pageNumber: buffer!.pageStart,
        title: buffer!.headingPath.at(-1) ?? null,
        content: text,
        source: meta?.pdfUrl ?? null,
        clause: clauseLabel,
        zone: baseZone,
        topic: inferTopic(buffer!.headingPath),
        metadata: normalizeChunkMetadata(
          metaDraft,
          text,
          cleanedPages.map((c) => c.page)
        ),
      });

      // Link previous ↔ current chunk IDs (post-hoc, we'll fix up below)
    }

    buffer = null;
  };

  // ─── Main page traversal ───────────────────────────────────────────────────

  for (let pi = 0; pi < cleanedPages.length; pi++) {
    const { page, cleanedMarkdown } = cleanedPages[pi];
    const pageNum = page.index + 1; // 1-based

    // Skip TOC pages (already parsed into structure.toc)
    if (cleanedMarkdown.trim().length === 0) continue;

    // Handle embedded tables as discrete chunks
    if (page.tables && page.tables.length > 0) {
      for (const table of page.tables) {
        flushBuffer(false);
        emitTableChunk(table, page, fileRecord, meta, structure, headingStack, chunks, config);
      }
    }

    // Handle images
    if (page.images && page.images.length > 0) {
      for (const image of page.images) {
        if (image.imageAnnotation && image.imageAnnotation.trim().length > 10) {
          flushBuffer(false);
          emitImageChunk(image, page, fileRecord, meta, structure, headingStack, chunks);
        }
      }
    }

    // Process text content: split at heading boundaries
    const pageHeadings = headingsByPage.get(page.index) ?? [];
    const segments = splitPageAtHeadings(cleanedMarkdown, pageHeadings);

    for (const segment of segments) {
      const { heading, text } = segment;

      if (heading) {
        // A new heading = flush current buffer
        flushBuffer(false);
        headingStack.push(heading);
      }

      if (text.trim().length === 0) continue;

      const sectionType = classifySection(text, headingStack.getBreadcrumb());
      const isDefinitionSection = sectionType === "definition";
      const isTocSection = sectionType === "toc";

      if (isTocSection) continue; // TOC already captured

      if (!buffer) {
        // Start new buffer
        buffer = {
          content: text,
          sectionType,
          pageStart: pageNum,
          pageEnd: pageNum,
          headingPath: [...headingStack.getBreadcrumb()],
          clauseNumber: extractClauseNumber(heading) ?? undefined,
          isDefinitionSection,
          isTocSection,
        };
      } else {
        // Continue buffer (multi-page continuation or same heading)
        buffer.content += "\n\n" + text;
        buffer.pageEnd = pageNum;
      }
    }
  }

  // Flush any remaining buffer at end of document
  flushBuffer(false);

  // ─── Post-process: link previousChunkId / nextChunkId ─────────────────────
  linkChunks(chunks);

  return chunks;
}

// ─── Table Chunk Emitter ──────────────────────────────────────────────────────

function emitTableChunk(
  table: OCRTableObject,
  page: OCRPageObject,
  fileRecord: RuleFilePrisma | FilesStrict,
  meta: RuleFileMetadata,
  structure: DocumentStructure,
  headingStack: HeadingStack,
  chunks: SemanticChunk[],
  config: IngestionConfig
): void {
  const pageNum = page.index + 1;
  const content = table.content;

  if (estimateTokens(content) < config.minChunkTokens) return;

  const chunkIndex = chunks.length;
  const headingPath = headingStack.getBreadcrumb();

  const metaDraft: Omit<ChunkMetadata, "keywords" | "references" | "wordCount"> = {
    fileName: fileRecord.name,
    documentType: meta?.type ?? structure.documentType,
    state: meta?.state ?? "",
    council: meta?.council,
    country: meta?.country ?? "Australia",
    legislationUrl: meta?.legislationUrl,
    sourcePage: meta?.sourcePage,
    etag: meta?.etag ?? "",
    pageStart: pageNum,
    pageEnd: pageNum,
    headingPath,
    sectionType: "table",
    continuedFromPrevious: false,
    continuesToNext: false,
    tocMatched: false,
    extractedFromOCR: true,
    chunkDepth: 0,
    hasTable: true,
    hasImage: false,
  };

  chunks.push({
    fileId: fileRecord.id,
    chunkIndex,
    pageNumber: pageNum,
    title: table.id ?? headingPath.at(-1) ?? "Table",
    content,
    source: meta?.pdfUrl ?? null,
    clause: extractClauseFromPath(headingPath),
    zone: headingStack.getCurrentZone(),
    topic: inferTopic(headingPath),
    metadata: normalizeChunkMetadata(
      metaDraft,
      content,
      [page]
    ),
  });
}

// ─── Image Chunk Emitter ──────────────────────────────────────────────────────

function emitImageChunk(
  image: OCRImageObject,
  page: OCRPageObject,
  fileRecord: RuleFilePrisma | FilesStrict,
  meta: RuleFileMetadata,
  structure: DocumentStructure,
  headingStack: HeadingStack,
  chunks: SemanticChunk[]
): void {
  const pageNum = page.index + 1;
  const content = image.imageAnnotation!;
  const headingPath = headingStack.getBreadcrumb();

  const metaDraft: Omit<ChunkMetadata, "keywords" | "references" | "wordCount"> = {
    fileName: fileRecord.name,
    documentType: meta?.type ?? structure.documentType,
    state: meta?.state ?? "",
    council: meta?.council,
    country: meta?.country ?? "Australia",
    legislationUrl: meta?.legislationUrl,
    etag: meta?.etag ?? "",
    pageStart: pageNum,
    pageEnd: pageNum,
    headingPath,
    sectionType: "image",
    continuedFromPrevious: false,
    continuesToNext: false,
    tocMatched: false,
    extractedFromOCR: true,
    chunkDepth: 0,
    hasTable: false,
    hasImage: true,
  };

  chunks.push({
    fileId: fileRecord.id,
    chunkIndex: chunks.length,
    pageNumber: pageNum,
    title: content.slice(0, 80),
    content,
    source: meta?.pdfUrl ?? null,
    clause: extractClauseFromPath(headingPath),
    zone: headingStack.getCurrentZone(),
    topic: inferTopic(headingPath),
    metadata: normalizeChunkMetadata(metaDraft, content, [page]),
  });
}

// ─── Page Segmentation ───────────────────────────────────────────────────────

/**
 * Split a page's markdown at heading positions.
 * Returns ordered array of {heading?, text} segments.
 */
function splitPageAtHeadings(
  markdown: string,
  headings: DetectedHeading[]
): Array<{ heading?: DetectedHeading; text: string }> {
  if (headings.length === 0) {
    return [{ text: markdown }];
  }

  const segments: Array<{ heading?: DetectedHeading; text: string }> = [];
  let lastOffset = 0;

  for (const heading of headings) {
    // Text before this heading
    const before = markdown.slice(lastOffset, heading.lineOffset).trim();
    if (before) segments.push({ text: before });

    // Find end of heading line
    const afterHeading = markdown.indexOf("\n", heading.lineOffset);
    lastOffset = afterHeading > 0 ? afterHeading + 1 : markdown.length;

    segments.push({ heading, text: "" });
  }

  // Remaining text after last heading
  const remainder = markdown.slice(lastOffset).trim();
  if (remainder) {
    if (segments.length > 0 && !segments.at(-1)!.text) {
      // Attach to the last heading segment
      segments.at(-1)!.text = remainder;
    } else {
      segments.push({ text: remainder });
    }
  }

  return segments.filter((s) => s.heading || s.text.trim().length > 0);
}

// ─── Section Classification ───────────────────────────────────────────────────

function classifySection(
  text: string,
  breadcrumb: string[]
): SectionType {
  const combined = (breadcrumb.join(" ") + " " + text).toLowerCase();

  if (/table of contents|contents$/i.test(combined)) return "toc";
  if (/definition|means |has the meaning/i.test(combined)) return "definition";
  if (/^schedule\s+\d/im.test(combined)) return "schedule";
  if (/^appendix\s+[a-z\d]/im.test(combined)) return "appendix";

  // Numbered clause pattern in breadcrumb
  if (/\d{1,2}\.\d{1,2}/.test(breadcrumb.join(" "))) return "clause";
  if (/^part\s+\d|^division\s+\d/im.test(combined)) return "heading";

  return "clause";
}

// ─── Definition Splitting ────────────────────────────────────────────────────

interface DefinitionChunk {
  term: string | null;
  content: string;
}

/**
 * Split a definitions section into individual term→meaning pairs.
 */
function splitDefinitions(text: string): DefinitionChunk[] {
  const chunks: DefinitionChunk[] = [];
  // Split on lines that start a new definition
  const defBoundaryRe = /(?=^["""*]{0,2}[A-Z][\w\s-]{1,60}["""*]{0,2}\s+(?:means|has the same meaning|includes|refers to))/m;
  const parts = text.split(defBoundaryRe);

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length < 10) continue;

    const termMatch = trimmed.match(
      /^["""*]{0,2}([A-Za-z][\w\s-]{1,60})["""*]{0,2}\s+(?:means|has the same meaning)/
    );
    chunks.push({
      term: termMatch ? termMatch[1].trim() : null,
      content: trimmed,
    });
  }

  return chunks.length > 0 ? [{ term: null, content: text }] : chunks;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractClauseNumber(heading?: DetectedHeading): string | null {
  if (!heading) return null;
  if (!heading.number) return null;
  return `${heading.level} ${heading.number}`.trim();
}

function extractClauseFromPath(path: string[]): string | null {
  for (let i = path.length - 1; i >= 0; i--) {
    const m = path[i].match(/(\d{1,2}(?:\.\d{1,2})+)/);
    if (m) return m[1];
  }
  return null;
}

function inferTopic(headingPath: string[]): string | null {
  if (headingPath.length === 0) return null;
  // Use the Part or Division-level heading as the topic
  for (const h of headingPath) {
    if (/^Part\s+\d|^Division\s+\d/i.test(h)) return h;
  }
  return headingPath[0] ?? null;
}

function isTOCMatched(
  headingPath: string[],
  structure: DocumentStructure
): boolean {
  if (structure.toc.length === 0) return false;
  const last = headingPath.at(-1)?.toLowerCase() ?? "";
  return structure.toc.some(
    (t) => t.text.toLowerCase() === last || t.number === extractClauseFromPath(headingPath)
  );
}

/**
 * Post-process: wire up previousChunkId and nextChunkId between adjacent chunks.
 * Uses index-based IDs as placeholders; the DB layer replaces with real UUIDs.
 */
function linkChunks(chunks: SemanticChunk[]): void {
  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) {
      chunks[i].metadata.previousChunkId = String(i - 1);
    }
    if (i < chunks.length - 1) {
      chunks[i].metadata.nextChunkId = String(i + 1);
    }
  }
}

// Export HeadingStack for testing
export { HeadingStack };