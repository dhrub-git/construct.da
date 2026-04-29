import prisma from "../prisma";
import { getWritable, sleep } from "workflow";
import { processPDFWithMistral } from "../ocr";
import { parseOCRDocument } from "../parser";
import { buildSemanticChunks } from "../chunks";
import { generateEmbeddings, saveEmbeddingsToDB } from "../embedding";
import type {
    IngestionConfig,
    SemanticChunk,
} from "@models/types";
import type {
    OCRPageObject,
    OCRResponse,
    OCRTableObject,
    OCRImageObject,
} from "@mistralai/mistralai/models/components";
import { FilesStrict, ProcessingProjectFileStatus } from "@models/data";
import { Prisma } from "@prisma/client";
import { convertJsonToListArray } from "../utils";

interface ProjectFilesConfig {
    batchSize?: number;
    concurrency?: number;
    fileIds?: string[];
    retryFailed?: boolean;
    maxRetries?: number;
    embeddingBatchSize?: number;
    requestDelayMs?: number;
}

interface ProjectFilesSummary {
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

export async function processProjectFiles(projectId: string, config?: ProjectFilesConfig) {
    "use workflow"

    const effectiveConfig = resolveConfig(config);
    console.log("Effective configuration for processing project files:", effectiveConfig);

    const { files, length } = await fetchProjectFiles(projectId, effectiveConfig);
    if (length === 0) {
        return {
            total: 0,
            processed: 0,
            succeeded: 0,
            failed: 0,
            skipped: 0,
        } satisfies ProjectFilesSummary;
    }
    const results = await processWithConcurrency(
        files,
        effectiveConfig.concurrency,
        async (file) => processSingleFile(file, effectiveConfig)
    );
    const summary = summarizeResults(results, length);
    if (summary.succeeded > 0) {
        await triggerReportGeneration(projectId, summary);
    }
    await finalizeStream();
    return summary;
}

function resolveConfig(config?: ProjectFilesConfig): Required<ProjectFilesConfig> {
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

async function fetchProjectFiles(projectId: string, config: Required<ProjectFilesConfig>): Promise<{ files: FilesStrict[]; length: number }> {
    "use step";
    try {
        const statuses: Array<"PENDING" | "FAILED"> = config.retryFailed
            ? ["PENDING", "FAILED"]
            : ["PENDING"];

        const whereClause: Prisma.FilesWhereInput = {
            status: { in: statuses },
            ...(config.fileIds.length > 0 ? { id: { in: config.fileIds } } : {}),
        };
        const files = await prisma.files.findMany({
            where: whereClause,
            orderBy: [{ createdAt: "asc" }],
            take: config.batchSize,
        })

        return {
            files: files.map(file => ({
                ...file,
                metadata: file.metadata as FilesStrict["metadata"],
            })),
            length: files.length
        };
    } catch (error) {
        console.error("Error fetching project files:", error);
        throw new Error(`Failed to fetch project files for project ${projectId}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

async function processWithConcurrency(
    items: FilesStrict[],
    concurrency: number,
    worker: (item: FilesStrict) => Promise<FileProcessResult>
): Promise<FileProcessResult[]> {
    const results = new Array<FileProcessResult>(items.length);
    let cursor = 0;

    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (cursor < items.length) {
            const currentIndex = cursor;
            cursor += 1;
            results[currentIndex] = await worker(items[currentIndex]);
            // Write to stream after each file is processed to provide real-time updates
            await writeToStream({
                completed: results.filter(r => r.status === "succeeded").length,
                total: items.length,
                failed: results.filter(r => r.status === "failed").length,
                completedFiles: results.filter(r => r.status === "succeeded").map(r => r.fileId),
                failedFiles: results.filter(r => r.status === "failed").map(r => r.fileId),
                processingFiles: results.filter(r => r.status === "succeeded" || r.status === "failed").map(r => r.fileId),
                processingComplete: results.filter(r => r.status === "succeeded" || r.status === "failed").length === items.length,
                nextRunId: null,
            });
        }
    });

    await Promise.all(workers);
    return results;
}

async function processSingleFile(
    file: FilesStrict,
    config: Required<ProjectFilesConfig>
): Promise<FileProcessResult> {
    const fileId = file.id;
    const projectId = file.projectId!;

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
                    file,
                    buildIngestionConfig(config)
                );
                logFile(fileId, `Chunked into ${chunks.length} chunks`);

                if (chunks.length === 0) {
                    return { chunks: 0, skipped: true };
                }

                await persistEmbeddings(fileId, projectId, chunks, config.embeddingBatchSize, config.requestDelayMs);
                logFile(fileId, "Embedded successfully");

                return { chunks: chunks.length, skipped: false };
            },
            config.maxRetries,
            fileId
        );

        if (attemptResult.skipped) {
            await markStatus(fileId, "PROCESSED", {
                ingestion: {
                    stage: "COMPLETED_WITHOUT_CHUNKS",
                    completedAt: new Date().toISOString(),
                },
            });

            return { fileId, status: "skipped", reason: "no_chunks" };
        }

        await markStatus(fileId, "PROCESSED", {
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

function logFile(fileId: string, message: string) {
    console.log(`[${fileId}] ${message}`);
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

async function handleFailure(fileId: string, error: unknown) {
    "use step";

    const errorMessage = toErrorMessage(error).slice(0, MAX_ERROR_MESSAGE_LENGTH);
    logFile(fileId, `Failed: ${errorMessage}`);

    await markStatus(fileId, "FAILED", {
        ingestion: {
            stage: "FAILED",
            failedAt: new Date().toISOString(),
            error: errorMessage,
        },
    });
}

async function markStatus(
    fileId: string,
    status: "PROCESSED" | "FAILED",
    metadataPatch?: Record<string, unknown>
) {
    "use step";

    const existing = await prisma.files.findUnique({
        where: { id: fileId },
        select: { metadata: true },
    });

    const mergedMetadata = mergeMetadata(
        asJsonObject(existing?.metadata),
        metadataPatch
    );

    await prisma.files.update({
        where: { id: fileId },
        data: {
            status,
            metadata: mergedMetadata,
        },
    });
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

async function updateFileMetadata(
    fileId: string,
    metadataPatch: Record<string, unknown>
) {
    "use step";

    const existing = await prisma.files.findUnique({
        where: { id: fileId },
        select: { metadata: true },
    });

    const mergedMetadata = mergeMetadata(
        asJsonObject(existing?.metadata),
        metadataPatch
    );

    await prisma.files.update({
        where: { id: fileId },
        data: {
            metadata: mergedMetadata,
        },
    });
}

async function runOCR(fileUrl: string) {
    "use step";

    return processPDFWithMistral(fileUrl);
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

function parseOCRResult(ocrResult: OCRResponse) {
    return parseOCRDocument(ocrResult);
}

function createChunks(
    cleanedPages: Array<{ page: OCRPageObject; cleanedMarkdown: string }>,
    structure: ReturnType<typeof parseOCRDocument>["structure"],
    file: FilesStrict,
    ingestionConfig: IngestionConfig
) {
    return buildSemanticChunks(cleanedPages, structure, file, ingestionConfig);
}

function buildIngestionConfig(config: Required<ProjectFilesConfig>): IngestionConfig {
    return {
        ...DEFAULT_INGESTION_CONFIG,
        maxRetries: config.maxRetries,
        embeddingBatchSize: config.embeddingBatchSize,
    };
}

async function persistEmbeddings(
    fileId: string,
    projectId: string,
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

        await saveEmbeddingsToDB(prisma, embedResult, fileId, null, { batch, offset }, projectId);

        // Delay between batches to avoid overwhelming the embedding service
        await new Promise((resolve) =>
            setTimeout(resolve, requestDelayMs)
        );
    }
}

function summarizeResults(results: FileProcessResult[], total: number): ProjectFilesSummary {
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

async function triggerReportGeneration(projectId: string, summary: ProjectFilesSummary) {
    "use step";
    try {
        const HOST = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const res = await fetch(`${HOST}/api/trigger-report`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ projectId }),
        });
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to trigger report generation: ${res.status} ${res.statusText} - ${errorText}`);
        }
        const data = await res.json();
        console.log(`Report generation triggered successfully for project ${projectId}:`, data);
        await writeToStream({
            completed: summary.succeeded,
            total: summary.total,
            failed: summary.failed,
            completedFiles: [],
            failedFiles: [],
            processingFiles: [],
            processingComplete: true,
            nextRunId: data.runId as string,
        });
        return {
            success: true,
            runId: data.runId,
        }
    } catch (error) {
        console.error(`Failed to trigger report generation for project ${projectId}:`, error);
        throw new Error(`Failed to trigger report generation for project ${projectId}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function writeToStream(data: ProcessingProjectFileStatus) {
    "use step";
    // Stream operations must happen in steps
    const writable = getWritable<ProcessingProjectFileStatus>();
    const writer = writable.getWriter();
    await writer.write(data);
    writer.releaseLock();
}

async function finalizeStream() {
    "use step";
    await getWritable().close(); // Signal completion
}