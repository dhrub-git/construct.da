/**
 * @file types.ts
 * Core type definitions for the regulatory document ingestion pipeline.
 * Designed for Australian planning/legal PDF documents (LEP, DCP, SEPPs, etc.)
 */

// ─── Document Metadata (from Prisma RuleFiles.metadata) ───────────────────────

export type RuleFileMetadata = {
  etag: string;
  type: string;              // e.g. "LEP", "DCP", "SEPP"
  state: string;             // e.g. "NSW"
  pdfUrl: string;
  status: string;            // e.g. "In Force"
  council?: string;          // e.g. "Balranald"
  country: string;           // e.g. "Australia"
  pathname: string;
  extension: string;
  sourcePage?: string;
  contentType: string;
  legislationUrl?: string;
};

export type RuleFilePrisma = {
  id: string;
  name: string;
  url: string;
  coverage: "COUNTRY" | "COUNCIL" | "STATE";
  status: "PENDING" | "APPROVED" | "REJECTED";
  metadata: RuleFileMetadata | null;
  createdAt: Date;
  ingestedAt: Date | null;
};

// ─── Document Structure Detection ─────────────────────────────────────────────

export type HeadingLevel =
  | "part"
  | "division"
  | "subdivision"
  | "section"
  | "clause"
  | "subclause"
  | "schedule"
  | "appendix"
  | "chapter"
  | "unknown";

export type SectionType =
  | "clause"
  | "table"
  | "definition"
  | "schedule"
  | "appendix"
  | "image"
  | "toc"
  | "preamble"
  | "heading"
  | "continuation";

export type DetectedHeading = {
  text: string;
  level: HeadingLevel;
  number?: string;           // e.g. "4.3", "Division 2"
  pageIndex: number;
  lineOffset: number;        // character offset within page markdown
  rawMatch: string;
};

export type TOCEntry = {
  text: string;
  number?: string;
  pageRef?: number;          // page number referenced in TOC
  level: HeadingLevel;
};

export type DocumentStructure = {
  toc: TOCEntry[];
  headings: DetectedHeading[];
  hasNumberedClauses: boolean;
  hasZones: boolean;
  hasDefinitions: boolean;
  hasSchedules: boolean;
  documentType: string;
  repeatedHeaderPattern?: string;  // normalized recurring header text
  repeatedFooterPattern?: string;
};

// ─── Chunk Types ───────────────────────────────────────────────────────────────

/**
 * Rich metadata attached to every chunk.
 * Stored in FileEmbedding.metadata (JSON column).
 */
export type ChunkMetadata = {
  // Document provenance
  fileName: string;
  documentType: string;      // "LEP" | "DCP" | "SEPP" | ...
  state: string;
  council?: string;
  country: string;
  legislationUrl?: string;
  sourcePage?: string;
  etag: string;              // for idempotent re-ingestion

  // Spatial location within document
  pageStart: number;         // 1-based for human readability
  pageEnd: number;
  headingPath: string[];     // ["Part 2", "Division 4", "Clause 4.3"]

  // Classification
  sectionType: SectionType;
  clauseNumber?: string;     // "4.3", "Schedule 2"
  zoneCode?: string;         // "R2", "IN1"
  definitionTerm?: string;   // for definition chunks

  // Continuity linking
  continuedFromPrevious: boolean;
  continuesToNext: boolean;
  previousChunkId?: string;
  nextChunkId?: string;

  // Quality signals
  tocMatched: boolean;       // heading appeared in TOC
  extractedFromOCR: true;
  confidenceScore?: number;  // avg OCR confidence for pages covered
  ocrWarnings?: string[];    // e.g. ["low_confidence_page_3"]

  // Retrieval enrichment
  references: string[];      // ["clause 4.3", "Schedule 2"]
  keywords: string[];        // domain-extracted terms
  synonyms?: string[];       // expanded terms for FTS

  // Structural
  chunkDepth: number;        // 0 = top-level, 1 = child of split
  parentChunkId?: string;    // if this is a child chunk of a large clause
  siblingIndex?: number;
  totalSiblings?: number;
  wordCount: number;
  hasTable: boolean;
  hasImage: boolean;
};

export type SemanticChunk = {
  // Maps to FileEmbedding columns
  fileId: string;
  chunkIndex: number;
  pageNumber: number;        // pageStart (1-based)
  title: string | null;
  content: string;
  source: string | null;     // URL to source document
  clause: string | null;
  zone: string | null;
  topic: string | null;
  metadata: ChunkMetadata;

  // Ephemeral — used during pipeline, not stored
  _rawText?: string;         // pre-normalised text for debugging
  _headingPath?: string[];   // transient during building
};

// ─── Pipeline Config & Results ─────────────────────────────────────────────────

export type IngestionConfig = {
  maxChunkTokens: number;        // default 512
  overlapTokens: number;         // default 64
  minChunkTokens: number;        // default 50 — discard micro-chunks
  embeddingModel: string;        // e.g. "text-embedding-3-small"
  embeddingBatchSize: number;    // default 100
  dbBatchSize: number;           // default 50
  maxRetries: number;            // default 3
  enableSemanticFallback: boolean;
  requestDelayMs: number;
};

export type IngestionResult = {
  fileId: string;
  fileName: string;
  chunksCreated: number;
  chunksSkipped: number;
  pagesProcessed: number;
  durationMs: number;
  errors: string[];
  warnings: string[];
};

// ─── Embedding Provider Interface ─────────────────────────────────────────────

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
  dimensions: number;
}