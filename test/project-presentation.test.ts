import { describe, expect, it } from "vitest";

import { ProjectStage, ProjectStatus, ProjectType, type ProjectStrict } from "@models/data";
import { buildDashboardMetrics, getDashboardProjectStatus } from "@/lib/project-presentation";

function createProject(overrides: Partial<ProjectStrict> = {}): ProjectStrict {
  return {
    id: "project-1",
    name: "Test project",
    description: null,
    address: "1 Example Street",
    type: ProjectType.NEW_DWELLING,
    council: "Sample Council",
    userId: "user-1",
    metadata: {
      geoEncoding: { lat: -33.8, lng: 151.2 },
      stage: ProjectStage.CREATED,
      processingStatus: ProjectStatus.CREATED,
    },
    createdAt: new Date("2026-04-20T10:00:00.000Z"),
    updatedAt: new Date("2026-04-20T10:00:00.000Z"),
    ...overrides,
  } as ProjectStrict;
}

describe("dashboard project presentation", () => {
  it("uses project metadata status instead of treating every project as created", () => {
    expect(
      getDashboardProjectStatus(
        createProject({
          metadata: {
            geoEncoding: { lat: -33.8, lng: 151.2 },
            stage: ProjectStage.COMPLIANCE_REVIEW,
            processingStatus: ProjectStatus.NEEDS_REVIEW,
          },
        }),
      ),
    ).toBe(ProjectStatus.NEEDS_REVIEW);
  });

  it("summarizes dashboard metrics for the hero cards", () => {
    const metrics = buildDashboardMetrics([
      createProject(),
      createProject({ id: "project-2", council: "Sample Council", metadata: { geoEncoding: { lat: 0, lng: 0 }, stage: ProjectStage.COMPLETED, processingStatus: ProjectStatus.COMPLETED } }),
      createProject({ id: "project-3", council: "Other Council", metadata: { geoEncoding: { lat: 0, lng: 0 }, stage: ProjectStage.PARSING, processingStatus: ProjectStatus.IN_PROGRESS } }),
      createProject({ id: "project-4", council: "Other Council", metadata: { geoEncoding: { lat: 0, lng: 0 }, stage: ProjectStage.COMPLIANCE_REVIEW, processingStatus: ProjectStatus.NEEDS_REVIEW } }),
    ]);

    expect(metrics).toEqual({
      total: 4,
      active: 2,
      needsReview: 1,
      completed: 1,
      councils: 2,
    });
  });
});
