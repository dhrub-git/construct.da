import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectStage, ProjectStatus, ProjectType, type ProjectStrict } from "@models/data";

const dashboardState = vi.hoisted(() => ({
  projects: [] as ProjectStrict[],
  loading: false,
  error: null as string | null,
  userId: "user-1",
}));

const dispatchMock = vi.hoisted(() => vi.fn(() => Promise.resolve()));
const pushMock = vi.hoisted(() => vi.fn());
const fetchUserProjectsMock = vi.hoisted(() => vi.fn((userId: string) => ({
  type: "dashboard/fetchUserProjects",
  payload: userId,
})));
const setUserIdMock = vi.hoisted(() => vi.fn((userId: string) => ({
  type: "dashboard/setUserId",
  payload: userId,
})));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/redux/dashboardSlice", () => ({
  fetchUserProjects: fetchUserProjectsMock,
  selectDashboardState: (state: { dashboard: typeof dashboardState }) => state.dashboard,
  setUserId: setUserIdMock,
}));

vi.mock("@/redux/useDispatch", async () => {
  const actual = await vi.importActual<typeof import("@/redux/useDispatch")>("@/redux/useDispatch");
  return {
    ...actual,
    useAppDispatch: () => dispatchMock,
    useAppSelector: <T,>(selector: (state: { dashboard: typeof dashboardState }) => T) =>
      selector({ dashboard: dashboardState }),
  };
});

vi.mock("@/components/projects/create-project-dialog", () => ({
  CreateProjectDialog: ({ triggerLabel = "Create project" }: { triggerLabel?: string }) => (
    <button type="button">{triggerLabel}</button>
  ),
}));

import { DashboardPageClient } from "@/components/projects/dashboard-page-client";

afterEach(() => {
  cleanup();
  dispatchMock.mockClear();
  pushMock.mockClear();
  fetchUserProjectsMock.mockClear();
  setUserIdMock.mockClear();
});

function createProject(overrides: Partial<ProjectStrict> = {}): ProjectStrict {
  return {
    id: "project-1",
    name: "Marrickville alteration",
    description: null,
    address: "24 Test Avenue, Marrickville NSW 2204",
    type: ProjectType.HOME_EXTENSION,
    council: "Inner West Council",
    userId: "user-1",
    metadata: {
      geoEncoding: { lat: -33.9, lng: 151.1 },
      stage: ProjectStage.FILES_UPLOADED,
      processingStatus: ProjectStatus.NEEDS_REVIEW,
    },
    createdAt: new Date("2026-04-20T10:00:00.000Z"),
    updatedAt: new Date("2026-04-20T10:00:00.000Z"),
    ...overrides,
  } as ProjectStrict;
}

describe("DashboardPageClient", () => {
  it("renders dashboard metrics and project register with trust-first copy", () => {
    dashboardState.projects = [
      createProject(),
      createProject({
        id: "project-2",
        name: "Bondi new dwelling",
        council: "Waverley Council",
        metadata: {
          geoEncoding: { lat: -33.8, lng: 151.2 },
          stage: ProjectStage.COMPLETED,
          processingStatus: ProjectStatus.COMPLETED,
        },
      }),
    ];
    dashboardState.loading = false;
    dashboardState.error = null;

    render(<DashboardPageClient userId="user-1" />);

    expect(
      screen.getByRole("heading", { name: /approval workspace/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/projects needing review/i)).toBeInTheDocument();
    expect(screen.getByText(/project register/i)).toBeInTheDocument();
    expect(screen.getByText(/2 councils/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /open marrickville alteration/i })[0]).toHaveAttribute(
      "href",
      "/dashboard/project-1",
    );
  });

  it("keeps search results clear and reversible", async () => {
    const user = userEvent.setup();
    dashboardState.projects = [createProject()];
    dashboardState.loading = false;
    dashboardState.error = null;

    render(<DashboardPageClient userId="user-1" />);

    await user.type(screen.getByRole("searchbox", { name: /search projects/i }), "no match");

    expect(screen.getByText(/no matching projects/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /clear search/i }));
    expect(screen.getAllByText(/marrickville alteration/i).length).toBeGreaterThan(0);
  });
});
