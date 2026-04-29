import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
  project: {
    create: vi.fn(),
  },
}));

const clerkAuthMock = vi.hoisted(() => vi.fn());
const currentUserMock = vi.hoisted(() => vi.fn());
const resolveUserIdByClerkIdentityMock = vi.hoisted(() => vi.fn());

vi.mock("../src/lib/prisma", () => ({
  default: prismaMock,
}));

vi.mock("../src/lib/geoEncoding", () => ({
  addressToCoordinatesGoogle: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: clerkAuthMock,
  currentUser: currentUserMock,
}));

vi.mock("@/lib/actions/users", () => ({
  resolveUserIdByClerkIdentity: resolveUserIdByClerkIdentityMock,
}));

import { createRossStreetMasterViewDemoProject } from "@/lib/actions/projects";
import { ROSS_STREET_MASTER_VIEW_APPLICATION } from "@/lib/masterview/north-sydney";

describe("project actions", () => {
  beforeEach(() => {
    prismaMock.$transaction.mockReset();
    prismaMock.project.create.mockReset();
    clerkAuthMock.mockReset();
    currentUserMock.mockReset();
    resolveUserIdByClerkIdentityMock.mockReset();
    clerkAuthMock.mockResolvedValue({ userId: "clerk-user-1" });
    currentUserMock.mockResolvedValue({
      primaryEmailAddress: { emailAddress: "planner@example.com" },
      fullName: "Planner Example",
    });
    resolveUserIdByClerkIdentityMock.mockResolvedValue("user-1");
  });

  it("creates the Ross Street demo with a nested write instead of an interactive transaction", async () => {
    prismaMock.$transaction.mockRejectedValue(
      new Error("interactive transaction should not be used"),
    );
    prismaMock.project.create.mockResolvedValue({
      id: "project-1",
      name: "Ross Street MasterView demo",
      description: null,
      address: "15A Ross Street, Waverton NSW 2060",
      type: "HOME_EXTENSION",
      council: "North Sydney Council",
      userId: "user-1",
      metadata: { masterView: { applicationNumber: "10.2026.00000172.001" } },
      createdAt: new Date("2026-04-29T00:00:00.000Z"),
      updatedAt: new Date("2026-04-29T00:00:00.000Z"),
    });

    await expect(createRossStreetMasterViewDemoProject()).resolves.toMatchObject({
      id: "project-1",
      metadata: {
        masterView: {
          applicationNumber: "10.2026.00000172.001",
        },
      },
    });

    expect(resolveUserIdByClerkIdentityMock).toHaveBeenCalledWith({
      clerkUserId: "clerk-user-1",
      email: "planner@example.com",
      name: "Planner Example",
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          Files: {
            createMany: {
              data: expect.arrayContaining([
                expect.objectContaining({
                  status: "PROCESSED",
                  metadata: expect.objectContaining({
                    source: "north-sydney-masterview",
                    applicationNumber: ROSS_STREET_MASTER_VIEW_APPLICATION.applicationNumber,
                  }),
                }),
              ]),
            },
          },
          ProjectReport: {
            create: expect.objectContaining({
              status: "COMPLETED",
              findings: {
                create: expect.arrayContaining([
                  expect.objectContaining({ key: "heritage_adjacency_review" }),
                ]),
              },
              checkResults: {
                create: expect.arrayContaining([
                  expect.objectContaining({ key: "masterview_document_pack" }),
                ]),
              },
            }),
          },
        }),
      }),
    );
  });

  it("rejects demo creation when no Clerk user is authenticated", async () => {
    clerkAuthMock.mockResolvedValue({ userId: null });

    await expect(createRossStreetMasterViewDemoProject()).rejects.toThrow(
      /authenticated/i,
    );

    expect(resolveUserIdByClerkIdentityMock).not.toHaveBeenCalled();
    expect(prismaMock.project.create).not.toHaveBeenCalled();
  });
});
