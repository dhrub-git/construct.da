import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function streamToBase64(
  stream: ReadableStream<Uint8Array>
): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  // merge chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);

  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  // Node.js way
  return Buffer.from(merged).toString("base64");
}

export function convertJsonToMDTable(
  rows: Record<string, unknown>[],
  options?: {
    columns?: string[];          // force column order / subset
    includeAllKeys?: boolean;   // union all keys across rows
    nullValue?: string;         // display for null/undefined
    maxCellLength?: number;     // truncate long cells
  }
): string {
  if (!rows?.length) return "";

  const {
    columns,
    includeAllKeys = true,
    nullValue = "",
    maxCellLength = 250,
  } = options ?? {};

  const headers =
    columns ??
    (includeAllKeys
      ? Array.from(
        new Set(rows.flatMap((row) => Object.keys(row)))
      )
      : Object.keys(rows[0]));

  if (!headers.length) return "";

  const escapeMarkdown = (value: string) =>
    value
      .replace(/\|/g, "\\|")
      .replace(/\n/g, " ")
      .replace(/\r/g, " ")
      .trim();

  const stringify = (value: unknown): string => {
    if (value === null || value === undefined) return nullValue;

    if (typeof value === "string") return value;

    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "bigint"
    ) {
      return String(value);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const formatCell = (value: unknown): string => {
    let text = escapeMarkdown(stringify(value));

    if (text.length > maxCellLength) {
      text = text.slice(0, maxCellLength - 3) + "...";
    }

    return text;
  };

  const headerRow = `| ${headers.join(" | ")} |`;
  const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;

  const bodyRows = rows.map((row) => {
    const cells = headers.map((header) => formatCell(row[header]));
    return `| ${cells.join(" | ")} |`;
  });

  return [headerRow, separatorRow, ...bodyRows].join("\n");
}

export function convertJsonToListArray(
  data: Record<string, unknown>,
  options?: {
    nullValue?: string;
    maxValueLength?: number;
  }
): { text: `${string}: ${string}` }[] {
  const { nullValue = "N/A", maxValueLength = 250 } = options ?? {};

  const parts: { text: `${string}: ${string}` }[] = [];

  const normalize = (text: string): string =>
    text.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();

  const truncate = (text: string): string =>
    text.length > maxValueLength
      ? `${text.slice(0, maxValueLength - 3)}...`
      : text;

  const formatPrimitive = (value: unknown): string => {
    if (value === null || value === undefined) return nullValue;

    if (typeof value === "string") return truncate(normalize(value));

    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "bigint"
    ) {
      return String(value);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return truncate(normalize(String(value)));
  };

  const walk = (value: unknown, path: string) => {
    if (value === null || value === undefined) {
      parts.push({ text: `${path}: ${nullValue}` });
      return;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        parts.push({ text: `${path}: []` });
        return;
      }

      value.forEach((item, index) => {
        walk(item, `${path}[${index}]`);
      });

      return;
    }

    if (typeof value === "object" && !(value instanceof Date)) {
      const entries = Object.entries(value as Record<string, unknown>);

      if (entries.length === 0) {
        parts.push({ text: `${path}: {}` });
        return;
      }

      for (const [key, nestedValue] of entries) {
        const nextPath = path ? `${path}.${key}` : key;
        walk(nestedValue, nextPath);
      }

      return;
    }

    parts.push({
      text: `${path}: ${formatPrimitive(value)}`,
    });
  };

  for (const [key, value] of Object.entries(data)) {
    walk(value, key);
  }

  return parts;
}