import { sleep } from "workflow";
import { Prisma } from "@prisma/client";
import type { OCRResponse, OCRTableObject, OCRImageObject } from "@mistralai/mistralai/models/components";
import type { IngestionConfig } from "@models/types";

export const DEFAULT_BATCH_SIZE = 10;
export const DEFAULT_CONCURRENCY = 3;
export const MAX_SAFE_CONCURRENCY = 5;
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_EMBEDDING_BATCH_SIZE = 50;
export const MAX_ERROR_MESSAGE_LENGTH = 2000;
export const MAX_REQUEST_DELAY_MS = 60_000;

export const DEFAULT_INGESTION_CONFIG: IngestionConfig = {
  maxChunkTokens: 512,
  overlapTokens: 64,
  minChunkTokens: 50,
  embeddingModel: "gemini-embedding-001",
  embeddingBatchSize: DEFAULT_EMBEDDING_BATCH_SIZE,
  dbBatchSize: 50,
  maxRetries: DEFAULT_MAX_RETRIES,
  enableSemanticFallback: true,
  requestDelayMs: 2000,
};

export interface IngestionRuntimeConfig {
  batchSize: number;
  concurrency: number;
  fileIds: string[];
  retryFailed: boolean;
  maxRetries: number;
  embeddingBatchSize: number;
  requestDelayMs: number;
}

export async function processItemsConcurrently<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
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

export function resolveIngestionConfig<T extends Partial<IngestionRuntimeConfig>>(config?: T): Required<IngestionRuntimeConfig> {
  const batchSize = clamp(config?.batchSize ?? DEFAULT_BATCH_SIZE, 1, 100);
  const concurrency = clamp(config?.concurrency ?? DEFAULT_CONCURRENCY, 1, MAX_SAFE_CONCURRENCY);
  const maxRetries = clamp(config?.maxRetries ?? DEFAULT_MAX_RETRIES, 1, 10);
  const embeddingBatchSize = clamp(config?.embeddingBatchSize ?? DEFAULT_EMBEDDING_BATCH_SIZE, 1, 200);
  const requestDelayMs = clamp(config?.requestDelayMs ?? DEFAULT_INGESTION_CONFIG.requestDelayMs, 0, MAX_REQUEST_DELAY_MS);

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

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function summarizeIngestionResults<T extends { status: "succeeded" | "failed" | "skipped" }>(
  results: readonly T[],
  total: number,
) {
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

export async function withRetries<T>(
  operation: (attempt: number) => Promise<T>,
  maxRetries: number,
  fileId: string,
  onRetry: (attempt: number, message: string) => void,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      onRetry(attempt, toErrorMessage(error));

      if (attempt < maxRetries) {
        await sleep(Math.min(2000 * attempt, 10_000));
      }
    }
  }

  throw lastError;
}

export function normalizeOCRResult(ocr: OCRResponse): OCRResponse {
  const pages = (ocr.pages ?? []).map((page, index) => {
    const safeMarkdown = typeof page.markdown === "string" ? page.markdown : "";

    return {
      ...page,
      index: typeof page.index === "number" ? page.index : index,
      markdown: safeMarkdown,
      tables: Array.isArray(page.tables) ? (page.tables as OCRTableObject[]) : [],
      images: Array.isArray(page.images) ? (page.images as OCRImageObject[]) : [],
      dimensions: page.dimensions ?? null,
    };
  });

  return {
    ...ocr,
    pages: pages.sort((a, b) => a.index - b.index),
  };
}

export function asJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown ingestion error";
}

export function mergeMetadata(
  current: Record<string, unknown>,
  patch?: Record<string, unknown>,
): Prisma.InputJsonValue {
  if (!patch) {
    return current as Prisma.InputJsonObject;
  }

  const merged = deepMerge(current, patch);
  return merged as Prisma.InputJsonObject;
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const output: Record<string, unknown> = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (
      isPlainObject(value) &&
      isPlainObject(output[key])
    ) {
      output[key] = deepMerge(
        output[key] as Record<string, unknown>,
        value as Record<string, unknown>,
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

export function buildIngestionConfig(config: Pick<IngestionRuntimeConfig, "maxRetries" | "embeddingBatchSize">): IngestionConfig {
  return {
    ...DEFAULT_INGESTION_CONFIG,
    maxRetries: config.maxRetries,
    embeddingBatchSize: config.embeddingBatchSize,
  };
}
