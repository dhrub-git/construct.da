"use client";

import { PutBlobResult } from "@vercel/blob";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ProjectError } from "@/components/projects/project-error";
import { ProjectFilesTab } from "@/components/projects/project-files-tab";
import { ProjectHeaderCard } from "@/components/projects/project-header-card";
import { ProjectLoading } from "@/components/projects/project-loading";
import { ProjectOverviewTab } from "@/components/projects/project-overview-tab";
import { ProjectReportTab } from "@/components/projects/project-report-tab";
import {
  clearProject,
  deleteProjectFile,
  fetchGeneratedReport,
  fetchProject,
  saveUploadedFiles,
  selectActiveProject,
  selectGeneratedReports,
  selectProjectError,
  selectProjectFiles,
  selectProjectLoading,
  setUserId,
} from "@/redux/projectSlice";
import { useAppDispatch, useAppSelector } from "@/redux/useDispatch";
import {
  WorkflowStreamProvider,
  useWorkflowStream,
} from "@/context/WorkflowStreamContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deriveProjectWorkspaceState } from "@/lib/project-workspace";
import { ProjectStrict } from "@models/data";

type ProjectDetailsPageClientProps = {
  projectId: string;
  userId: string;
};

function toFileType(file: File): string {
  const extension = file.name.split(".").pop();
  if (extension) {
    return extension.toLowerCase();
  }

  if (file.type.includes("/")) {
    return file.type.split("/")[1] ?? file.type;
  }

  return "unknown";
}

function WorkspaceContent({ projectId, userId }: ProjectDetailsPageClientProps) {
  const dispatch = useAppDispatch();
  const project = useAppSelector(selectActiveProject);
  const files = useAppSelector(selectProjectFiles);
  const reports = useAppSelector(selectGeneratedReports);
  const loading = useAppSelector(selectProjectLoading);
  const error = useAppSelector(selectProjectError);
  const { connected, loading: streamLoading, fileStatus, reportStatus, startListening } = useWorkflowStream();

  const [startingProcess, setStartingProcess] = useState(false);
  const [replacementTargetId, setReplacementTargetId] = useState<string | null>(null);
  const handledReportStatusRef = useRef<string | null>(null);

  const workspace = useMemo(() => {
    if (!project) {
      return null;
    }

    return deriveProjectWorkspaceState(
      project as ProjectStrict,
      files,
      reports,
      {
        connected,
        loading: streamLoading,
        fileStatus,
        reportStatus,
      },
    );
  }, [connected, fileStatus, files, project, reportStatus, reports, streamLoading]);

  useEffect(() => {
    const status = reportStatus?.status ?? null;
    if (!status || status === handledReportStatusRef.current) {
      return;
    }

    if (status === "COMPLETED" || status === "FAILED") {
      handledReportStatusRef.current = status;
      startTransition(() => {
        void dispatch(fetchProject(projectId));
        void dispatch(fetchGeneratedReport(projectId));
      });
    }
  }, [dispatch, projectId, reportStatus?.status]);

  useEffect(() => {
    dispatch(setUserId(userId));
    startTransition(() => {
      void dispatch(fetchProject(projectId));
      void dispatch(fetchGeneratedReport(projectId));
    });

    return () => {
      dispatch(clearProject());
    };
  }, [dispatch, projectId, userId]);

  const handleProcess = async () => {
    if (!workspace?.canStartProcessing) {
      return;
    }

    setStartingProcess(true);

    try {
      const response = await fetch("/api/process-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(errorPayload?.message ?? "Unable to start processing.");
      }

      const payload = (await response.json()) as { runId?: string };

      if (payload.runId) {
        startListening(payload.runId);
      }

      startTransition(() => {
        void dispatch(fetchProject(projectId));
      });
    } finally {
      setStartingProcess(false);
    }
  };

  const handleUploaded = async (blob: PutBlobResult, file: File) => {
    const saved = await dispatch(
      saveUploadedFiles({
        files: [
          {
            filename: file.name,
            mimetype: file.type,
            size: file.size,
            projectId,
            userId,
            url: blob.url,
            fileType: toFileType(file),
          },
        ],
      }),
    ).unwrap();

    if (replacementTargetId) {
      await dispatch(deleteProjectFile({ fileId: replacementTargetId, projectId })).unwrap();
      setReplacementTargetId(null);
    }

    if (saved.success) {
      startTransition(() => {
        void dispatch(fetchProject(projectId));
      });
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    await dispatch(deleteProjectFile({ fileId, projectId })).unwrap();
    startTransition(() => {
      void dispatch(fetchProject(projectId));
    });
  };

  if (loading && !project) {
    return <ProjectLoading />;
  }

  if (error) {
    return <ProjectError message={error} onRetry={() => dispatch(fetchProject(projectId))} />;
  }

  if (!project || !workspace) {
    return (
      <div className="mx-auto flex w-full max-w-7xl px-6 py-10 lg:px-10 lg:py-12">
        <EmptyState variant="noProjects" />
      </div>
    );
  }

  const workspaceWithLiveState = {
    ...workspace,
    isProcessing: workspace.isProcessing || startingProcess,
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:px-10 lg:py-12">
      <ProjectHeaderCard
        project={project}
        workspace={workspaceWithLiveState}
        onProcess={handleProcess}
        processDisabled={!workspace.canStartProcessing || startingProcess || workspace.isProcessing}
      />

      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProjectOverviewTab projectId={projectId} workspace={workspaceWithLiveState} />
        </TabsContent>

        <TabsContent value="report">
          <ProjectReportTab workspace={workspaceWithLiveState} />
        </TabsContent>

        <TabsContent value="files">
          <ProjectFilesTab
            workspace={workspaceWithLiveState}
            replacementTargetId={replacementTargetId}
            onStartReplace={setReplacementTargetId}
            onCancelReplace={() => setReplacementTargetId(null)}
            onDeleteFile={handleDeleteFile}
            onUploaded={handleUploaded}
            uploadDisabled={startingProcess || workspace.isProcessing}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ProjectDetailsPageClient({ projectId, userId }: ProjectDetailsPageClientProps) {
  const project = useAppSelector(selectActiveProject);

  return (
    <WorkflowStreamProvider
      key={project?.metadata.runId ?? projectId}
      initialRunId={project?.metadata.runId ?? null}
    >
      <WorkspaceContent projectId={projectId} userId={userId} />
    </WorkflowStreamProvider>
  );
}
