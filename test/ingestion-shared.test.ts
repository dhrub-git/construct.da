import { describe, expect, it } from "vitest";
import {
  IngestionConfigValidationError,
  parseIngestionRuntimeConfig,
  resolveIngestionConfig,
} from "@/lib/workflows/ingestion-shared";

describe("parseIngestionRuntimeConfig", () => {
  it("accepts undefined config", () => {
    expect(parseIngestionRuntimeConfig(undefined)).toBeUndefined();
  });

  it("rejects malformed primitive config", () => {
    expect(() => parseIngestionRuntimeConfig("fast")).toThrow(IngestionConfigValidationError);
  });

  it("rejects non-finite numeric values", () => {
    expect(() => parseIngestionRuntimeConfig({ concurrency: Number.NaN })).toThrow("concurrency must be a finite number");
    expect(() => parseIngestionRuntimeConfig({ batchSize: Infinity })).toThrow("batchSize must be a finite number");
  });

  it("rejects malformed fileIds and retry flag", () => {
    expect(() => parseIngestionRuntimeConfig({ fileIds: ["file-1", 2] })).toThrow("fileIds must be an array");
    expect(() => parseIngestionRuntimeConfig({ retryFailed: "yes" })).toThrow("retryFailed must be a boolean");
  });
});

describe("resolveIngestionConfig", () => {
  it("clamps finite runtime values to safe bounds", () => {
    expect(resolveIngestionConfig({
      batchSize: 500,
      concurrency: 99,
      maxRetries: 50,
      embeddingBatchSize: 500,
      requestDelayMs: 99_999,
      fileIds: ["a"],
      retryFailed: true,
    })).toMatchObject({
      batchSize: 100,
      concurrency: 5,
      maxRetries: 10,
      embeddingBatchSize: 200,
      requestDelayMs: 60_000,
      fileIds: ["a"],
      retryFailed: true,
    });
  });
});
