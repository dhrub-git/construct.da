import {
  checksResultSchema,
  complianceCheckSchema,
  findingSchema,
  ProjectTypeEnum,
  type ChecksResult,
  type ComplianceCheck,
  type ExtractedFacts,
  type Finding,
  type ProjectContext,
  type RulesPack,
} from "@/lib/agent/types";

const requiredDocsByType: Partial<Record<ProjectTypeEnum, string[]>> = {
  NEW_DWELLING: [
    "SITE_PLAN",
    "FLOOR_PLANS",
    "ELEVATIONS",
    "STATEMENT_OF_ENVIRONMENTAL_EFFECTS",
  ],
  HOME_EXTENSION: ["SITE_PLAN", "FLOOR_PLANS", "ELEVATIONS"],
  SECOND_STOREY_ADDITION: ["SITE_PLAN", "FLOOR_PLANS", "ELEVATIONS"],
  GRANNY_FLAT: ["SITE_PLAN", "FLOOR_PLANS", "ELEVATIONS"],
  CHANGE_OF_USE: ["STATEMENT_OF_ENVIRONMENTAL_EFFECTS"],
};

function normalizeDocType(value: string): string {
  return value.trim().toUpperCase().replaceAll(" ", "_");
}

function checkToFinding(check: ComplianceCheck): Finding {
  return findingSchema.parse({
    key: check.key,
    severity: check.severity,
    title: check.message,
    detail: check.message,
    evidence: check.evidence,
    recommendation: check.passed ? null : "Review this item before submission.",
  });
}

function calculateScore(findings: Finding[]): number {
  const penalties = findings.reduce((acc, finding) => {
    if (finding.severity === "HIGH") return acc + 20;
    if (finding.severity === "MEDIUM") return acc + 10;
    return acc + 5;
  }, 0);

  return Math.max(0, Math.min(100, 100 - penalties));
}

function inferPathway(score: number, highCount: number): string {
  if (highCount > 0 || score < 60) {
    return "Full DA pathway with planner review";
  }

  if (score >= 85) {
    return "Potentially suitable for streamlined assessment";
  }

  return "Standard DA pathway with targeted follow-up";
}

export function runComplianceChecksTool(input: {
  project: ProjectContext;
  facts: ExtractedFacts;
  rules: RulesPack;
}): ChecksResult {
  const { project, facts } = input;
  const checks: ComplianceCheck[] = [];

  const knownDocumentTypes = new Set(
    project.documents
      .flatMap((document) => [document.fileType, document.mimeType])
      .filter((value): value is string => Boolean(value))
      .map(normalizeDocType)
  );

  const detectedReports = new Set(facts.detectedReports.map(normalizeDocType));
  const requiredDocs = requiredDocsByType[project.projectType] ?? [];
  const missingDocuments = requiredDocs.filter(
    (docType) => !knownDocumentTypes.has(docType) && !detectedReports.has(docType)
  );

  for (const docType of missingDocuments) {
    checks.push(
      complianceCheckSchema.parse({
        key: `missing_doc_${docType.toLowerCase()}`,
        category: "COMPLETENESS",
        passed: false,
        severity: "HIGH",
        message: `Required document appears missing: ${docType}.`,
        expected: docType,
        actual: null,
        evidence: ["project.documents"],
      })
    );
  }

  if (missingDocuments.length === 0) {
    checks.push(
      complianceCheckSchema.parse({
        key: "completeness_required_docs",
        category: "COMPLETENESS",
        passed: true,
        severity: "LOW",
        message: "Required document baseline appears complete for this project type.",
        evidence: ["project.documents"],
      })
    );
  }

  if (facts.siteArea && facts.floorArea) {
    const computedFsr = facts.floorArea / facts.siteArea;
    if (facts.fsr !== null && Math.abs(computedFsr - facts.fsr) > 0.15) {
      checks.push(
        complianceCheckSchema.parse({
          key: "numeric_fsr_mismatch",
          category: "NUMERIC_THRESHOLD",
          passed: false,
          severity: "MEDIUM",
          message: "Provided FSR does not align with floor area and site area values.",
          expected: Number(computedFsr.toFixed(2)),
          actual: facts.fsr,
          evidence: ["facts.floorArea", "facts.siteArea", "facts.fsr"],
        })
      );
    }
  }

  if (facts.frontage !== null && facts.frontage < 6) {
    checks.push(
      complianceCheckSchema.parse({
        key: "numeric_frontage_low",
        category: "NUMERIC_THRESHOLD",
        passed: false,
        severity: "MEDIUM",
        message: "Frontage appears low and may trigger planning merit concerns.",
        expected: ">= 6m",
        actual: facts.frontage,
        evidence: ["facts.frontage"],
      })
    );
  }

  if (facts.height !== null && facts.height > 12) {
    checks.push(
      complianceCheckSchema.parse({
        key: "numeric_height_high",
        category: "NUMERIC_THRESHOLD",
        passed: false,
        severity: "HIGH",
        message: "Proposed height may exceed typical low-density controls.",
        expected: "<= 12m (indicative)",
        actual: facts.height,
        evidence: ["facts.height"],
      })
    );
  }

  if (facts.floorArea !== null && facts.siteArea !== null && facts.floorArea > facts.siteArea * 1.1) {
    checks.push(
      complianceCheckSchema.parse({
        key: "contradiction_floor_area_site_area",
        category: "CONTRADICTION",
        passed: false,
        severity: "HIGH",
        message: "Floor area substantially exceeds site area and needs verification.",
        expected: "Floor area should usually remain below or near site area depending on controls.",
        actual: { floorArea: facts.floorArea, siteArea: facts.siteArea },
        evidence: ["facts.floorArea", "facts.siteArea"],
      })
    );
  }

  if (facts.bedrooms !== null && facts.bedrooms > 0 && facts.parking !== null && facts.parking === 0) {
    checks.push(
      complianceCheckSchema.parse({
        key: "contradiction_parking_bedrooms",
        category: "CONTRADICTION",
        passed: false,
        severity: "MEDIUM",
        message: "Bedrooms detected but no parking allocation identified.",
        expected: ">= 1 parking space for residential use (indicative)",
        actual: { bedrooms: facts.bedrooms, parking: facts.parking },
        evidence: ["facts.bedrooms", "facts.parking"],
      })
    );
  }

  const pathwayHint =
    missingDocuments.length === 0 &&
    checks.filter((check) => check.severity === "HIGH" && !check.passed).length === 0
      ? "Likely suitable for standard processing"
      : "Likely requires full planner review";

  checks.push(
    complianceCheckSchema.parse({
      key: "pathway_eligibility",
      category: "PATHWAY_ELIGIBILITY",
      passed: missingDocuments.length === 0,
      severity: missingDocuments.length === 0 ? "LOW" : "MEDIUM",
      message: pathwayHint,
      expected: "Complete baseline pack with no high-severity conflicts",
      actual: {
        missingDocuments: missingDocuments.length,
        highSeverityIssues: checks.filter((check) => !check.passed && check.severity === "HIGH").length,
      },
      evidence: ["checks.completeness", "checks.numeric", "checks.contradictions"],
    })
  );

  checks.push(
    complianceCheckSchema.parse({
      key: "risk_rule_coverage",
      category: "RISK_HEURISTIC",
      passed: input.rules.rules.length > 0,
      severity: input.rules.rules.length > 0 ? "LOW" : "MEDIUM",
      message:
        input.rules.rules.length > 0
          ? "Applicable rule coverage retrieved for this project."
          : "No high-confidence rules were retrieved; advisory confidence is reduced.",
      evidence: ["rules.rules"],
    })
  );

  const findings = checks.filter((check) => !check.passed).map(checkToFinding);
  const score = calculateScore(findings);
  const highCount = findings.filter((finding) => finding.severity === "HIGH").length;
  const riskLevel = score >= 85 ? "LOW" : score >= 60 ? "MEDIUM" : "HIGH";

  return checksResultSchema.parse({
    checks,
    findings,
    score,
    riskLevel,
    missingDocuments,
    likelyPathway: inferPathway(score, highCount),
    blockingIssues: findings
      .filter((finding) => finding.severity === "HIGH")
      .map((finding) => finding.title),
  });
}
