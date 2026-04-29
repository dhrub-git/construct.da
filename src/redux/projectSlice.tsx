import { createAsyncThunk, createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { FileSpecs, FilesStrict, GenerateProjectReport, ProjectWithFiles } from "@models/data";
import { fetchProjectGeneratedReports, getProjectById } from "@actions/projects";
import { deleteFileFromProject, uploadFilesToProject } from "@actions/files";

interface ProjectState {
  userId: string | null;
  project: Omit<ProjectWithFiles, "Files"> | null;
  files: FilesStrict[];
  generatedReports: GenerateProjectReport[]
  loading: boolean;
  error: string | null;
}

const initialState: ProjectState = {
  userId: null,
  project: null,
  files: [],
  generatedReports: [],
  loading: false,
  error: null,
};

export const fetchProject = createAsyncThunk<
  ProjectWithFiles,
  string,
  { state: RootState }
>("project/fetchProject", async (projectId) => {
  try {
    const project = await getProjectById(projectId);

    return project;
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
});

export const fetchGeneratedReport = createAsyncThunk<
  GenerateProjectReport[],
  string,
  { state: RootState }
>("project/fetchGeneratedReport", async (projectId) => {
  try {
    const reports = await fetchProjectGeneratedReports(projectId);
    return reports;
  } catch (error) {
    console.error("Error fetching generated reports:", error);
    throw error;
  }
});

export const saveUploadedFiles = createAsyncThunk<
  { success: boolean; count: number; allFiles: FilesStrict[] },
  { files: FileSpecs[] },
  { state: RootState }
>("project/saveUploadedFiles", async ({ files }) => {
  try {
    const result = await uploadFilesToProject(files);
    return result;
  } catch (error) {
    console.error("Error saving uploaded files:", error);
    throw error;
  }
});

export const deleteProjectFile = createAsyncThunk<
  FilesStrict[],
  { fileId: string; projectId: string },
  { state: RootState }
>("project/deleteProjectFile", async ({ fileId, projectId }) => {
  try {
    return await deleteFileFromProject({ fileId, projectId });
  } catch (error) {
    console.error("Error deleting file from project:", error);
    throw error;
  }
});

export const projectSlice = createSlice({
  name: "project",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.loading = false;
        const { Files, ...projectData } = action.payload;
        state.project = projectData;
        state.files = Files;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch project";
      })
      .addCase(saveUploadedFiles.pending, (state) => {
        state.error = null;
      })
      .addCase(saveUploadedFiles.fulfilled, (state, action) => {
        state.files = action.payload.allFiles;
      })
      .addCase(saveUploadedFiles.rejected, (state, action) => {
        state.error = action.error.message || "Failed to save uploaded files";
      })
      .addCase(deleteProjectFile.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteProjectFile.fulfilled, (state, action) => {
        state.files = action.payload;
      })
      .addCase(deleteProjectFile.rejected, (state, action) => {
        state.error = action.error.message || "Failed to delete file";
      })
      .addCase(fetchGeneratedReport.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchGeneratedReport.fulfilled, (state, action) => {
        state.generatedReports = action.payload;
      })
      .addCase(fetchGeneratedReport.rejected, (state, action) => {
        state.error = action.error.message || "Failed to fetch generated reports";
      });
  },
  reducers: {
    setUserId: (state, action: PayloadAction<string>) => {
      state.userId = action.payload;
    },
    clearProject: () => initialState,
  },
});

export const { clearProject, setUserId } = projectSlice.actions;

export const selectProjectState = (state: RootState) => state.project;
export const selectActiveProject = (state: RootState) => state.project.project;
export const selectProjectFiles = (state: RootState) => state.project.files;
export const selectGeneratedReports = (state: RootState) => state.project.generatedReports;
export const selectProjectError = (state: RootState) => state.project.error;
export const selectProjectLoading = (state: RootState) => state.project.loading;
export const selectLatestGeneratedReport = createSelector(
  selectGeneratedReports,
  (reports) => reports[0] ?? null,
);

export const selectProjectLoaded = createSelector(
  selectActiveProject,
  (project) => Boolean(project),
);

export default projectSlice.reducer;
