import { describe, expect, it } from "vitest";

import {
  deterministicPdfViolationBoxes,
  getFixturePdfViolations,
  getPdfViolationsForPage,
  PDF_FIXTURE_FILE_ID,
  PDF_FIXTURE_PAGE,
  summarizePdfViolationSeverities,
} from "@/lib/pdf/violation-schema";
import { derivePdfScale, pdfUserSpaceToCssPercentRect, pdfUserSpaceToCssRect } from "@/lib/pdf/coordinates";

describe("PDF violation fixtures", () => {
  it("provides deterministic fixture boxes with stable severity coverage", () => {
    expect(deterministicPdfViolationBoxes).toHaveLength(3);
    expect(deterministicPdfViolationBoxes.map((violation) => violation.id)).toEqual([
      "height-plane-north-east",
      "side-setback-west",
      "landscape-deep-soil",
    ]);
    expect(summarizePdfViolationSeverities(deterministicPdfViolationBoxes)).toEqual({
      error: 1,
      warning: 1,
      info: 1,
    });
  });

  it("can bind fixture violations to an uploaded file id", () => {
    const boundViolations = getFixturePdfViolations("uploaded-file-1");

    expect(boundViolations).toHaveLength(deterministicPdfViolationBoxes.length);
    expect(boundViolations.every((violation) => violation.fileId === "uploaded-file-1")).toBe(true);
    expect(deterministicPdfViolationBoxes.every((violation) => violation.fileId === PDF_FIXTURE_FILE_ID)).toBe(true);
  });

  it("filters violations by one-indexed PDF page", () => {
    expect(getPdfViolationsForPage(deterministicPdfViolationBoxes, 1)).toHaveLength(3);
    expect(getPdfViolationsForPage(deterministicPdfViolationBoxes, 2)).toEqual([]);
  });
});

describe("PDF coordinate transforms", () => {
  it("converts PDF user-space boxes to CSS coordinates with y-axis flipped", () => {
    const rect = pdfUserSpaceToCssRect(
      { x: 100, y: 150, w: 50, h: 25 },
      { width: 600, height: 800, scale: 2 },
    );

    expect(rect).toEqual({
      left: 200,
      top: 1250,
      width: 100,
      height: 50,
    });
  });

  it("converts fixture boxes into CSS percentage rectangles for responsive overlays", () => {
    const rect = pdfUserSpaceToCssPercentRect(deterministicPdfViolationBoxes[0], PDF_FIXTURE_PAGE);

    expect(rect).toEqual({
      left: "64.8739%",
      top: "32.304%",
      width: "19.8319%",
      height: "8.7886%",
    });
  });

  it("derives a scale from a target rendered page width", () => {
    expect(derivePdfScale(PDF_FIXTURE_PAGE, 297.5)).toBe(0.5);
  });
});
