import { describe, expect, it } from "vitest";

import { ProjectStage, ProjectStatus, type GenerateProjectReport, type FilesStrict, type ProjectStrict } from "@models/data";
import { buildFixtureSpatialConstraints, SpatialConstraintSource } from "@/lib/spatial";

import { buildProjectReportMarkdown, deriveProjectWorkspaceState } from "@/lib/project-workspace";

function createProject(overrides: Partial<ProjectStrict> = {}): ProjectStrict {
  return {
    id: "project-1",
    name: "Test project",
    description: null,
    address: "1 Example Street",
    type: "NEW_DWELLING",
    council: "Sample Council",
    userId: "user-1",
    metadata: {
      geoEncoding: { lat: -33.8, lng: 151.2 },
      stage: ProjectStage.FILES_UPLOADED,
      processingStatus: ProjectStatus.NEEDS_REVIEW,
      filesUpdatedAt: "2026-04-26T09:00:00.000Z",
    },
    createdAt: new Date("2026-04-20T10:00:00.000Z"),
    updatedAt: new Date("2026-04-25T10:00:00.000Z"),
    ...overrides,
  } as ProjectStrict;
}

function createReport(overrides: Partial<GenerateProjectReport> = {}): GenerateProjectReport {
  return {
    id: "report-1",
    projectId: "project-1",
    status: "COMPLETED",
    score: 82,
    summary: "Summary",
    executiveSummary: "Executive summary",
    findingsJson: null,
    factsJson: null,
    rulesJson: null,
    rawOutputJson: null,
    content: {
      summary: {
        executiveSummary: "Executive summary",
        likelyRisks: ["Risk A"],
        missingDocs: ["Site plan"],
        recommendedNextSteps: ["Upload the site plan"],
        confidenceNote: "High confidence",
        summary: "Summary",
      },
      checks: {
        checks: [
          {
            key: "check-1",
            category: "COMPLETENESS",
            passed: true,
            severity: "LOW",
            message: "Looks good",
            evidence: [],
          },
        ],
        findings: [
          {
            key: "finding-1",
            severity: "HIGH",
            title: "Missing document",
            detail: "A site plan is missing.",
            evidence: [],
            recommendation: "Upload a site plan.",
          },
        ],
        score: 82,
        riskLevel: "MEDIUM",
        missingDocuments: ["Site plan"],
        likelyPathway: "Compliant with conditions",
        blockingIssues: [],
      },
    },
    rawOutput: {
      facts: {} as never,
      rules: {} as never,
      summary: {
        executiveSummary: "Executive summary",
        likelyRisks: ["Risk A"],
        missingDocs: ["Site plan"],
        recommendedNextSteps: ["Upload the site plan"],
        confidenceNote: "High confidence",
        summary: "Summary",
      },
      checks: {
        checks: [],
        findings: [],
        score: 82,
        riskLevel: "MEDIUM",
        missingDocuments: ["Site plan"],
        likelyPathway: "Compliant with conditions",
        blockingIssues: [],
      },
      issues: [],
    },
    findings: [
      {
        id: "finding-row-1",
        projectReportId: "report-1",
        key: "finding-1",
        severity: "HIGH",
        title: "Missing document",
        detail: "A site plan is missing.",
        evidence: [],
        recommendation: "Upload a site plan.",
        createdAt: new Date("2026-04-25T12:00:00.000Z"),
      },
    ],
    checkResults: [
      {
        id: "check-row-1",
        projectReportId: "report-1",
        key: "check-1",
        category: "COMPLETENESS",
        passed: true,
        severity: "LOW",
        message: "Looks good",
        expected: null,
        actual: null,
        evidence: [],
        createdAt: new Date("2026-04-25T12:00:00.000Z"),
      },
    ],
    createdAt: new Date("2026-04-25T12:00:00.000Z"),
    updatedAt: new Date("2026-04-25T12:00:00.000Z"),
    version: 2,
    ...overrides,
  } as GenerateProjectReport;
}

function createFile(overrides: Partial<FilesStrict> = {}): FilesStrict {
  return {
    id: "file-1",
    name: "site-plan.pdf",
    url: "https://example.com/site-plan.pdf",
    projectId: "project-1",
    userId: "user-1",
    status: "PROCESSED",
    metadata: {
      mimeType: "application/pdf",
      size: 2048,
      fileType: "pdf",
    },
    createdAt: new Date("2026-04-25T09:30:00.000Z"),
    updatedAt: new Date("2026-04-25T09:30:00.000Z"),
    ...overrides,
  } as FilesStrict;
}

describe("project workspace helpers", () => {
  it("derives processing controls from project metadata and report history", () => {
    const state = deriveProjectWorkspaceState(
      createProject(),
      [createFile()],
      [createReport()],
      { connected: false, loading: false, fileStatus: null, reportStatus: null },
    );

    expect(state.status).toBe(ProjectStatus.NEEDS_REVIEW);
    expect(state.needsRerun).toBe(true);
    expect(state.canStartProcessing).toBe(true);
    expect(state.completionPercent).toBe(100);
    expect(state.hasReport).toBe(true);
    expect(state.processingActionLabel).toBe("Re-run Report");
    expect(state.reportMetadata?.version).toBe(2);
  });

  it("exposes spatial constraints from project metadata", () => {
    const spatialConstraints = buildFixtureSpatialConstraints({
      address: "1 Example Street",
      council: "Sample Council",
    });

    const state = deriveProjectWorkspaceState(
      createProject({
        metadata: {
          ...createProject().metadata,
          spatialConstraints,
          spatialConstraintsLoadedAt: "2026-04-29T00:00:00.000Z",
          spatialConstraintsSource: SpatialConstraintSource.FIXTURE,
        },
      }),
      [],
      [],
      { connected: false, loading: false, fileStatus: null, reportStatus: null },
    );

    expect(state.hasSpatialConstraints).toBe(true);
    expect(state.spatialConstraints).toHaveLength(5);
    expect(state.spatialConstraints[0]?.value).toBe("R2 Low Density Residential");
    expect(state.spatialConstraintSource).toBe(SpatialConstraintSource.FIXTURE);
    expect(state.spatialConstraintsLoadedAt).toBe("2026-04-29T00:00:00.000Z");
  });

  it("safely defaults missing spatial constraints to an empty list", () => {
    const state = deriveProjectWorkspaceState(
      createProject(),
      [],
      [],
      { connected: false, loading: false, fileStatus: null, reportStatus: null },
    );

    expect(state.hasSpatialConstraints).toBe(false);
    expect(state.spatialConstraints).toEqual([]);
    expect(state.spatialConstraintSource).toBeNull();
  });


  it("exposes MasterView and no-clause-4.6 control-case metadata", () => {
    const state = deriveProjectWorkspaceState(
      createProject({
        metadata: {
          ...createProject().metadata,
          masterView: {
            applicationNumber: "10.2026.00000172.001",
            councilReference: "DA172/2026",
            sourceUrl: "https://masterview.northsydney.nsw.gov.au/Application/ApplicationDetails/010.2026.00000172.001/",
            status: "In Progress",
            determinationType: "Pending",
            submittedDate: "2026-04-24",
            notificationStart: "2026-05-13",
            notificationEnd: "2026-05-27",
            estimatedCost: "$330,000.00",
            applicant: "Developable Pty Ltd",
            officer: "Min-Shih Wu",
            documents: [],
          },
          clause46: {
            triggered: false,
            reason: "SEE states height and controls are compliant.",
            source: "MasterView SEE",
          },
        },
      }),
      [],
      [],
      { connected: false, loading: false, fileStatus: null, reportStatus: null },
    );

    expect(state.masterView?.applicationNumber).toBe("10.2026.00000172.001");
    expect(state.clause46?.triggered).toBe(false);
    expect(state.clause46?.reason).toMatch(/compliant/i);
  });

  it("builds report markdown with metadata and checks", () => {
    const markdown = buildProjectReportMarkdown(createReport());

    expect(markdown).toContain("# Compliance report v2");
    expect(markdown).toContain("## Compliance checks");
    expect(markdown).toContain("| check-1 | COMPLETENESS | Pass | LOW | Looks good |");
    expect(markdown).toContain("## Findings");
    expect(markdown).toContain("Missing document");
  });
});