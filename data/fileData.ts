import fs from "node:fs";
import path from "node:path";

export enum Coverage {
    STATE = "STATE",
    COUNTRY = "COUNTRY",
    COUNCIL = "COUNCIL",
}

export interface RuleFiles {
    name: string;
    filePath: string;
    coverage: Coverage;
    metadata: Record<string, string>;
}

const FILES_ROOT = path.resolve(process.cwd(), "files");

const toTitleCase = (value: string): string =>
    value
        .replace(/\.[^.]+$/, "")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (m) => m.toUpperCase());

const walk = (dir: string): string[] => {
    if (!fs.existsSync(dir)) return [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    return entries.flatMap((entry) => {
        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) return walk(full);
        if (entry.isFile()) return [full];
        return [];
    });
};

const inferCoverage = (segments: string[]): Coverage => {
    const joined = segments.join("/").toLowerCase();

    if (
        joined.includes("council") ||
        joined.includes("councils") ||
        joined.includes("shire") ||
        joined.includes("municipality")
    ) {
        return Coverage.COUNCIL;
    }

    if (
        joined.includes("country") ||
        joined.includes("national") ||
        joined.includes("federal") ||
        joined.includes("australia") ||
        joined.includes("ncc") ||
        joined.includes("abcb")
    ) {
        return Coverage.COUNTRY;
    }

    return Coverage.STATE;
};

const detectState = (text: string): string | undefined => {
    if (/\bnsw\b/.test(text)) return "NSW";
    if (/\bvic\b|\bvictoria\b/.test(text)) return "Victoria";
    if (/\bqld\b|\bqueensland\b/.test(text)) return "Queensland";
    if (/\bsa\b|\bsouth australia\b/.test(text)) return "South Australia";
    if (/\bwa\b|\bwestern australia\b/.test(text)) return "Western Australia";
    if (/\btas\b|\btasmania\b/.test(text)) return "Tasmania";
    if (/\bact\b/.test(text)) return "ACT";
    if (/\bnt\b|\bnorthern territory\b/.test(text)) return "Northern Territory";
};

const inferMetadata = (relativePath: string): Record<string, string> => {
    const normalized = relativePath.replace(/\\/g, "/");
    const segments = normalized.split("/");
    const fileName = segments.at(-1)!;
    const ext = path.extname(fileName).slice(1).toLowerCase();
    const text = normalized.toLowerCase();

    const metadata: Record<string, string> = {
        extension: ext || "unknown",
        source: "files",
    };

    const year = text.match(/\b(19|20)\d{2}\b/)?.[0];
    if (year) metadata.year = year;

    const topFolder = segments[0];
    if (topFolder) metadata.category = toTitleCase(topFolder);

    const state = detectState(text);
    if (state) metadata.state = state;

    const councilMatch = text.match(/councils?\/([^/]+)/);
    if (councilMatch?.[1]) {
        metadata.council = toTitleCase(councilMatch[1]);
    }

    if (text.includes("checklist")) metadata.documentType = "Checklist";
    else if (text.includes("guide")) metadata.documentType = "Guide";
    else if (text.includes("policy")) metadata.documentType = "Policy";
    else if (text.includes("lep")) metadata.documentType = "LEP";
    else if (text.includes("dcp")) metadata.documentType = "DCP";
    else if (text.includes("form")) metadata.documentType = "Form";
    else if (text.includes("template")) metadata.documentType = "Template";
    else if (text.includes("fact")) metadata.documentType = "Fact Sheet";

    return metadata;
};

export const ruleFiles = walk(FILES_ROOT)
    .map((absolutePath) => {
        const relative = path.relative(process.cwd(), absolutePath).replace(/\\/g, "/");

        return {
            name: toTitleCase(path.basename(relative)),
            filePath: relative,
            coverage: inferCoverage(relative.split("/").slice(0, -1)),
            metadata: inferMetadata(relative),
        };
    })
    .sort((a, b) => a.filePath.localeCompare(b.filePath)) satisfies RuleFiles[];