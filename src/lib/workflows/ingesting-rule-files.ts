// src/lib/workflows/ingesting-rule-files.ts
import prisma from "../prisma";
import { sleep } from "workflow";
import { processPDFWithMistral } from "../ocr";
import { parseOCRDocument } from "../parser";
import { buildSemanticChunks } from "../chunks";
import { generateEmbeddings, saveEmbeddingsToDB } from "../embedding";
import type {
    IngestionConfig,
    RuleFilePrisma,
    SemanticChunk,
} from "@models/types";
import type {
    OCRPageObject,
    OCRResponse,
    OCRTableObject,
    OCRImageObject,
} from "@mistralai/mistralai/models/components";
import type { Prisma, RuleFiles } from "@prisma/client";
import { convertJsonToListArray } from "../utils";

interface IngestRuleFilesConfig {
    batchSize?: number;
    concurrency?: number;
    fileIds?: string[];
    retryFailed?: boolean;
    maxRetries?: number;
    embeddingBatchSize?: number;
    requestDelayMs?: number;
}

interface IngestSummary {
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
    skipped: number;
}

interface FileProcessResult {
    fileId: string;
    status: "succeeded" | "failed" | "skipped";
    reason?: string;
}

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_CONCURRENCY = 3;
const MAX_SAFE_CONCURRENCY = 5;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_EMBEDDING_BATCH_SIZE = 50;
const MAX_ERROR_MESSAGE_LENGTH = 2000;
const MAX_REQUEST_DELAY_MS = 60_000; // 1 minute

const DEFAULT_INGESTION_CONFIG: IngestionConfig = {
    maxChunkTokens: 512,
    overlapTokens: 64,
    minChunkTokens: 50,
    embeddingModel: "gemini-embedding-001",
    embeddingBatchSize: DEFAULT_EMBEDDING_BATCH_SIZE,
    dbBatchSize: 50,
    maxRetries: DEFAULT_MAX_RETRIES,
    enableSemanticFallback: true,
    requestDelayMs: 2000, // 2 seconds default delay between embedding batches
};

export async function handleIngestRuleFiles(config?: IngestRuleFilesConfig) {
    "use workflow";

    const effectiveConfig = resolveConfig(config);
    console.log("Ingesting rule files with config:", effectiveConfig);

    const { files, length } = await fetchRuleFiles(effectiveConfig);
    if (length === 0) {
        return {
            total: 0,
            processed: 0,
            succeeded: 0,
            failed: 0,
            skipped: 0,
        } satisfies IngestSummary;
    }

    const results = await processWithConcurrency(
        files,
        effectiveConfig.concurrency,
        async (file) => processSingleFile(file, effectiveConfig)
    );

    return summarizeResults(results, length);
}

function resolveConfig(config?: IngestRuleFilesConfig): Required<IngestRuleFilesConfig> {
    const batchSize = clamp(config?.batchSize ?? DEFAULT_BATCH_SIZE, 1, 100);
    const concurrency = clamp(
        config?.concurrency ?? DEFAULT_CONCURRENCY,
        1,
        MAX_SAFE_CONCURRENCY
    );
    const maxRetries = clamp(config?.maxRetries ?? DEFAULT_MAX_RETRIES, 1, 10);
    const embeddingBatchSize = clamp(
        config?.embeddingBatchSize ?? DEFAULT_EMBEDDING_BATCH_SIZE,
        1,
        200
    );
    const requestDelayMs = clamp(
        config?.requestDelayMs ?? DEFAULT_INGESTION_CONFIG.requestDelayMs,
        0,
        MAX_REQUEST_DELAY_MS
    );

    return {
        batchSize,
        concurrency,
        fileIds: config?.fileIds ?? [],
        retryFailed: config?.retryFailed ?? false,
        maxRetries,
        embeddingBatchSize,
        requestDelayMs,
    };
}

async function fetchRuleFiles(config: Required<IngestRuleFilesConfig>) {
    "use step";

    try {
        const statuses: Array<"PENDING" | "REJECTED"> = config.retryFailed
            ? ["PENDING", "REJECTED"]
            : ["PENDING"];

        const whereClause: Prisma.RuleFilesWhereInput = {
            status: { in: statuses },
            ...(config.fileIds.length > 0 ? { id: { in: config.fileIds } } : {}),
        };

        const ruleFiles = await prisma.ruleFiles.findMany({
            where: whereClause,
            orderBy: [{ createdAt: "asc" }],
            take: config.batchSize,
        });

        return {
            files: ruleFiles,
            length: ruleFiles.length,
        };
    } catch (error) {
        console.error("Error fetching rule files:", error);
        throw error;
    }
}

async function processSingleFile(
    file: RuleFiles,
    config: Required<IngestRuleFilesConfig>
): Promise<FileProcessResult> {
    const fileId = file.id;

    if (!file.url) {
        await handleFailure(fileId, new Error("File URL is missing"));
        return { fileId, status: "failed", reason: "missing_url" };
    }

    try {
        await updateFileMetadata(fileId, {
            ingestion: {
                stage: "STARTED",
                startedAt: new Date().toISOString(),
            },
        });

        const attemptResult = await withRetries(
            async (attempt) => {
                logFile(fileId, `OCR started (attempt ${attempt}/${config.maxRetries})`);
                const ocrResult = await runOCR(file.url);
                logFile(fileId, "OCR complete");

                const normalizedOcrResult = normalizeOCRResult(ocrResult);
                const { cleanedPages, structure } = parseOCRResult(normalizedOcrResult);
                logFile(fileId, `Parsed into ${structure.headings.length} headings`);

                const chunks = createChunks(
                    cleanedPages,
                    structure,
                    toRuleFilePrisma(file),
                    buildIngestionConfig(config)
                );
                logFile(fileId, `Chunked into ${chunks.length} chunks`);

                if (chunks.length === 0) {
                    return { chunks: 0, skipped: true };
                }

                await persistEmbeddings(fileId, chunks, config.embeddingBatchSize, config.requestDelayMs);
                logFile(fileId, "Embedded successfully");

                return { chunks: chunks.length, skipped: false };
            },
            config.maxRetries,
            fileId
        );

        if (attemptResult.skipped) {
            await markStatus(fileId, "APPROVED", {
                ingestion: {
                    stage: "COMPLETED_WITHOUT_CHUNKS",
                    completedAt: new Date().toISOString(),
                },
            });

            return { fileId, status: "skipped", reason: "no_chunks" };
        }

        await markStatus(fileId, "APPROVED", {
            ingestion: {
                stage: "COMPLETED",
                completedAt: new Date().toISOString(),
                chunks: attemptResult.chunks,
            },
        });

        return { fileId, status: "succeeded" };
    } catch (error) {
        await handleFailure(fileId, error);
        return {
            fileId,
            status: "failed",
            reason: toErrorMessage(error),
        };
    }
}

async function runOCR(fileUrl: string) {
    "use step";

    return processPDFWithMistral(fileUrl);
}

function parseOCRResult(ocrResult: OCRResponse) {
    return parseOCRDocument(ocrResult);
}

function createChunks(
    cleanedPages: Array<{ page: OCRPageObject; cleanedMarkdown: string }>,
    structure: ReturnType<typeof parseOCRDocument>["structure"],
    file: RuleFilePrisma,
    ingestionConfig: IngestionConfig
) {
    return buildSemanticChunks(cleanedPages, structure, file, ingestionConfig);
}

async function persistEmbeddings(
    fileId: string,
    chunks: SemanticChunk[],
    embeddingBatchSize: number,
    requestDelayMs: number
) {
    "use step";

    await prisma.fileEmbedding.deleteMany({ where: { fileId } });

    for (let offset = 0; offset < chunks.length; offset += embeddingBatchSize) {
        const batch = chunks.slice(offset, offset + embeddingBatchSize);
        const embeddingInput = batch.map((chunk) => {
            const context = convertJsonToListArray(chunk, {
                nullValue: "Not Present",
                maxValueLength: 300,
            })
            return { text: chunk.content, context }
        });
        const embedResult = await generateEmbeddings(embeddingInput);

        if (embedResult.embeddings.length !== batch.length) {
            throw new Error(
                `Embedding result mismatch for file ${fileId}: ` +
                `${embedResult.embeddings.length} vectors for ${batch.length} chunks`
            );
        }

        await saveEmbeddingsToDB(prisma, embedResult, null, fileId, { batch, offset });
        // Use a delay between batches to avoid overwhelming the embedding service or hitting rate limits
        await new Promise((resolve) =>
            setTimeout(resolve, requestDelayMs)
        );
    }
}

async function markStatus(
    fileId: string,
    status: "APPROVED" | "REJECTED",
    metadataPatch?: Record<string, unknown>
) {
    "use step";

    const existing = await prisma.ruleFiles.findUnique({
        where: { id: fileId },
        select: { metadata: true },
    });

    const mergedMetadata = mergeMetadata(
        asJsonObject(existing?.metadata),
        metadataPatch
    );

    await prisma.ruleFiles.update({
        where: { id: fileId },
        data: {
            status,
            ingestedAt: status === "APPROVED" ? new Date() : undefined,
            metadata: mergedMetadata,
        },
    });
}

async function handleFailure(fileId: string, error: unknown) {
    "use step";

    const errorMessage = toErrorMessage(error).slice(0, MAX_ERROR_MESSAGE_LENGTH);
    logFile(fileId, `Failed: ${errorMessage}`);

    await markStatus(fileId, "REJECTED", {
        ingestion: {
            stage: "FAILED",
            failedAt: new Date().toISOString(),
            error: errorMessage,
        },
    });
}

async function updateFileMetadata(
    fileId: string,
    metadataPatch: Record<string, unknown>
) {
    "use step";

    const existing = await prisma.ruleFiles.findUnique({
        where: { id: fileId },
        select: { metadata: true },
    });

    const mergedMetadata = mergeMetadata(
        asJsonObject(existing?.metadata),
        metadataPatch
    );

    await prisma.ruleFiles.update({
        where: { id: fileId },
        data: {
            metadata: mergedMetadata,
        },
    });
}

function normalizeOCRResult(ocr: OCRResponse): OCRResponse {
    const pages = (ocr.pages ?? []).map((page, index) => {
        const safeMarkdown = typeof page.markdown === "string" ? page.markdown : "";

        return {
            ...page,
            index: typeof page.index === "number" ? page.index : index,
            markdown: safeMarkdown,
            tables: Array.isArray(page.tables)
                ? (page.tables as OCRTableObject[])
                : [],
            images: Array.isArray(page.images)
                ? (page.images as OCRImageObject[])
                : [],
            dimensions: page.dimensions ?? null,
        };
    });

    return {
        ...ocr,
        pages: pages.sort((a, b) => a.index - b.index),
    };
}

function buildIngestionConfig(config: Required<IngestRuleFilesConfig>): IngestionConfig {
    return {
        ...DEFAULT_INGESTION_CONFIG,
        maxRetries: config.maxRetries,
        embeddingBatchSize: config.embeddingBatchSize,
    };
}

async function withRetries<T>(
    operation: (attempt: number) => Promise<T>,
    maxRetries: number,
    fileId: string
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation(attempt);
        } catch (error) {
            lastError = error;
            logFile(fileId, `Attempt ${attempt} failed: ${toErrorMessage(error)}`);

            if (attempt < maxRetries) {
                await sleep(Math.min(2000 * attempt, 10_000));
            }
        }
    }

    throw lastError;
}

async function processWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    worker: (item: T) => Promise<R>
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let cursor = 0;

    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (cursor < items.length) {
            const currentIndex = cursor;
            cursor += 1;
            results[currentIndex] = await worker(items[currentIndex]);
        }
    });

    await Promise.all(workers);
    return results;
}

function summarizeResults(results: FileProcessResult[], total: number): IngestSummary {
    const succeeded = results.filter((result) => result.status === "succeeded").length;
    const failed = results.filter((result) => result.status === "failed").length;
    const skipped = results.filter((result) => result.status === "skipped").length;

    return {
        total,
        processed: results.length,
        succeeded,
        failed,
        skipped,
    };
}

function asJsonObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }

    return value as Record<string, unknown>;
}

function mergeMetadata(
    current: Record<string, unknown>,
    patch?: Record<string, unknown>
): Prisma.InputJsonValue {
    if (!patch) {
        return current as Prisma.InputJsonObject;
    }

    const merged = deepMerge(current, patch);
    return merged as Prisma.InputJsonObject;
}

function toRuleFilePrisma(file: RuleFiles): RuleFilePrisma {
    const metadata = asJsonObject(file.metadata);

    return {
        ...file,
        metadata: metadata as RuleFilePrisma["metadata"],
    };
}

function deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
): Record<string, unknown> {
    const output: Record<string, unknown> = { ...target };

    for (const [key, value] of Object.entries(source)) {
        if (
            isPlainObject(value) &&
            isPlainObject(output[key])
        ) {
            output[key] = deepMerge(
                output[key] as Record<string, unknown>,
                value as Record<string, unknown>
            );
            continue;
        }

        output[key] = value;
    }

    return output;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === "string") {
        return error;
    }

    return "Unknown ingestion error";
}

function logFile(fileId: string, message: string) {
    console.log(`[${fileId}] ${message}`);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}