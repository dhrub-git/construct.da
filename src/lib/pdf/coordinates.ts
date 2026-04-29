import type { PdfViolationBox } from "@/lib/pdf/violation-schema";

export type PdfPageDimensions = {
  width: number;
  height: number;
};

export type PdfScaleOptions = PdfPageDimensions & {
  scale?: number;
};

export type CssViolationRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type CssViolationRectPercent = {
  left: string;
  top: string;
  width: string;
  height: string;
};

export function pdfUserSpaceToCssRect(
  box: Pick<PdfViolationBox, "x" | "y" | "w" | "h">,
  options: PdfScaleOptions,
): CssViolationRect {
  const scale = options.scale ?? 1;

  return {
    left: box.x * scale,
    top: (options.height - box.y - box.h) * scale,
    width: box.w * scale,
    height: box.h * scale,
  };
}

export function pdfUserSpaceToCssPercentRect(
  box: Pick<PdfViolationBox, "x" | "y" | "w" | "h">,
  page: PdfPageDimensions,
): CssViolationRectPercent {
  const rect = pdfUserSpaceToCssRect(box, page);

  return {
    left: toPercent(rect.left / page.width),
    top: toPercent(rect.top / page.height),
    width: toPercent(rect.width / page.width),
    height: toPercent(rect.height / page.height),
  };
}

export function derivePdfScale(page: PdfPageDimensions, targetWidth: number): number {
  if (page.width <= 0) {
    return 1;
  }

  return targetWidth / page.width;
}

function toPercent(ratio: number): string {
  return `${Number((ratio * 100).toFixed(4))}%`;
}
