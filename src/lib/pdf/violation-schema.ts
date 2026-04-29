export type ViolationSeverity = "info" | "warning" | "error";

export type PdfViolationBox = {
  id: string;
  fileId: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  coordinateSpace: "pdf-user-space";
  severity: ViolationSeverity;
  rule: string;
  title: string;
  message: string;
};

export type PdfViolationFixturePage = {
  page: number;
  width: number;
  height: number;
};

export const PDF_FIXTURE_FILE_ID = "fixture-site-plan-pdf";

export const PDF_FIXTURE_PAGE: PdfViolationFixturePage = {
  page: 1,
  width: 595,
  height: 842,
};

export const deterministicPdfViolationBoxes = [
  {
    id: "height-plane-north-east",
    fileId: PDF_FIXTURE_FILE_ID,
    page: 1,
    x: 386,
    y: 496,
    w: 118,
    h: 74,
    coordinateSpace: "pdf-user-space",
    severity: "error",
    rule: "LEP cl. 4.3 Height of buildings",
    title: "Height plane exceedance",
    message: "North-east roof form is marked above the 8.5 m height control and needs a cl. 4.6 variation pathway.",
  },
  {
    id: "side-setback-west",
    fileId: PDF_FIXTURE_FILE_ID,
    page: 1,
    x: 68,
    y: 300,
    w: 86,
    h: 220,
    coordinateSpace: "pdf-user-space",
    severity: "warning",
    rule: "DCP setback control",
    title: "Side setback pinch point",
    message: "Western wall alignment is within the fixture side setback band; confirm surveyed dimensions before lodgement.",
  },
  {
    id: "landscape-deep-soil",
    fileId: PDF_FIXTURE_FILE_ID,
    page: 1,
    x: 210,
    y: 112,
    w: 168,
    h: 68,
    coordinateSpace: "pdf-user-space",
    severity: "info",
    rule: "DCP landscape area",
    title: "Deep soil evidence needed",
    message: "Landscape notation is present but the extracted schedule does not prove the minimum deep-soil percentage.",
  },
] satisfies PdfViolationBox[];


export const rossStreetControlCasePdfViolationBoxes = [
  {
    id: "ross-height-control-confirmed",
    fileId: "ross-street-site-plan",
    page: 1,
    x: 382,
    y: 508,
    w: 126,
    h: 62,
    coordinateSpace: "pdf-user-space",
    severity: "info",
    rule: "North Sydney LEP cl. 4.3 Height of buildings",
    title: "8.5 m height control captured",
    message: "The Ross Street control case records the 8.5 m height control and the SEE marks height compliance as satisfied; no cl. 4.6 draft is triggered.",
  },
  {
    id: "ross-heritage-adjacent-review",
    fileId: "ross-street-site-plan",
    page: 1,
    x: 86,
    y: 318,
    w: 154,
    h: 156,
    coordinateSpace: "pdf-user-space",
    severity: "warning",
    rule: "North Sydney DCP heritage context",
    title: "Heritage-adjacent referral",
    message: "The site is not listed and is outside a conservation area, but nearby heritage items and the Heritage Officer referral remain a review risk.",
  },
  {
    id: "ross-document-pack-complete",
    fileId: "ross-street-site-plan",
    page: 1,
    x: 214,
    y: 112,
    w: 184,
    h: 70,
    coordinateSpace: "pdf-user-space",
    severity: "info",
    rule: "MasterView lodged document checklist",
    title: "Document evidence imported",
    message: "BASIX, Heritage Statement, SEE, site plans, survey, stormwater, waste, shadow diagrams, and notification plans are attached from MasterView.",
  },
] satisfies PdfViolationBox[];

export function getRossStreetControlCasePdfViolations(fileId = "ross-street-site-plan"): PdfViolationBox[] {
  return rossStreetControlCasePdfViolationBoxes.map((violation) => ({
    ...violation,
    fileId,
  }));
}

export function getFixturePdfViolations(fileId = PDF_FIXTURE_FILE_ID): PdfViolationBox[] {
  return deterministicPdfViolationBoxes.map((violation) => ({
    ...violation,
    fileId,
  }));
}

export function getPdfViolationsForPage(violations: PdfViolationBox[], page: number): PdfViolationBox[] {
  return violations.filter((violation) => violation.page === page);
}

export function summarizePdfViolationSeverities(violations: PdfViolationBox[]): Record<ViolationSeverity, number> {
  return violations.reduce<Record<ViolationSeverity, number>>(
    (summary, violation) => ({
      ...summary,
      [violation.severity]: summary[violation.severity] + 1,
    }),
    { info: 0, warning: 0, error: 0 },
  );
}
