import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { ProjectSpecs, ProjectStrict } from "@models/data";
import { getProjectsForUser, createProject } from "@actions/projects";

interface DashboardState {
  projects: ProjectStrict[];
  loading: boolean;
  error: string | null;
  userId: string | null;
}

const initialState: DashboardState = {
  projects: [],
  loading: false,
  error: null,
  userId: null,
};

export const fetchUserProjects = createAsyncThunk<
  ProjectStrict[],
  string,
  { state: RootState }
>("dashboard/fetchUserProjects", async (userId) => {
  try {
    return await getProjectsForUser(userId);
  } catch (error) {
    console.error("Error fetching user projects:", error);
    throw error;
  }
});

export const createProjectThunk = createAsyncThunk<
  ProjectStrict,
  { project: ProjectSpecs },
  { state: RootState }
>("dashboard/createProject", async ({ project }) => {
  try {
    return await createProject(project);
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
});

export const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchUserProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch user projects";
      })
      .addCase(createProjectThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(createProjectThunk.fulfilled, (state, action) => {
        state.projects.push(action.payload);
      })
      .addCase(createProjectThunk.rejected, (state, action) => {
        state.error = action.error.message || "Failed to create project";
      });
  },
  reducers: {
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
    },
    clearDashboard: () => initialState,
  },
});

export const { setUserId, clearDashboard } = dashboardSlice.actions;

export const selectDashboardState = (state: RootState) => state.dashboard;
export const selectDashboardProjects = (state: RootState) => state.dashboard.projects;

export default dashboardSlice.reducer;
