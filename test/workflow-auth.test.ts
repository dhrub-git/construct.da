import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  project: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: prismaMock,
}));

import {
  hasAdminRole,
  hasValidIngestionServiceToken,
  resolveProjectOwnership,
} from "@/lib/api/workflow-auth";

describe("resolveProjectOwnership", () => {
  beforeEach(() => {
    prismaMock.project.findUnique.mockReset();
  });

  it("authorizes when project owner Clerk ID matches the authenticated Clerk ID", async () => {
    prismaMock.project.findUnique.mockResolvedValue({
      id: "project-1",
      userId: "db-user-1",
      metadata: { processingStatus: "NEEDS_REVIEW" },
      User: { clerkUserId: "clerk-user-1" },
    });

    await expect(resolveProjectOwnership("project-1", "clerk-user-1")).resolves.toEqual({
      status: "owned",
      project: {
        id: "project-1",
        userId: "db-user-1",
        metadata: { processingStatus: "NEEDS_REVIEW" },
      },
    });
  });

  it("forbids when Clerk ID does not match the project owner's Clerk ID", async () => {
    prismaMock.project.findUnique.mockResolvedValue({
      id: "project-1",
      userId: "db-user-1",
      User: { clerkUserId: "other-clerk-user" },
    });

    await expect(resolveProjectOwnership("project-1", "clerk-user-1")).resolves.toEqual({
      status: "forbidden",
    });
  });

  it("reports missing projects separately from forbidden projects", async () => {
    prismaMock.project.findUnique.mockResolvedValue(null);

    await expect(resolveProjectOwnership("missing", "clerk-user-1")).resolves.toEqual({
      status: "missing",
    });
  });
});

describe("ingestion admin checks", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts admin roles from custom session claims", () => {
    expect(hasAdminRole({ metadata: { role: "admin" } })).toBe(true);
    expect(hasAdminRole({ publicMetadata: { roles: ["reviewer", "admin"] } })).toBe(true);
    expect(hasAdminRole({ role: "member" })).toBe(false);
  });

  it("accepts the configured service token", () => {
    vi.stubEnv("INGESTION_ADMIN_TOKEN", "secret-token");

    const request = new Request("https://example.test/api/ingest", {
      headers: { "x-ingestion-admin-token": "secret-token" },
    });

    expect(hasValidIngestionServiceToken(request)).toBe(true);
  });
});
