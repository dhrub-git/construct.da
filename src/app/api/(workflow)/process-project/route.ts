import { start } from "workflow/api";
import { processProjectFiles } from "@workflows/process-project-files";
import { NextResponse } from "next/server";
import { updateProjectMetadata } from "@/lib/actions/projects";
import { ProjectStage, ProjectStatus } from "@models/data";
import { auth } from "@clerk/nextjs/server";
import { resolveProjectOwnership } from "@/lib/api/workflow-auth";
import {
  IngestionConfigValidationError,
  parseIngestionRuntimeConfig,
} from "@/lib/workflows/ingestion-shared";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let projectId: string;
  let config: ReturnType<typeof parseIngestionRuntimeConfig>;
  try {
    const body = await request.json();
    projectId = body.projectId;
    config = parseIngestionRuntimeConfig(body.config);
  } catch (error) {
    const message = error instanceof IngestionConfigValidationError
      ? error.message
      : "Invalid request body";
    return NextResponse.json({ message }, { status: 400 });
  }

  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json({ message: "projectId is required" }, { status: 400 });
  }

  const ownership = await resolveProjectOwnership(projectId, userId);
  if (ownership.status === "missing") {
    return NextResponse.json({ message: "Project not found" }, { status: 404 });
  }
  if (ownership.status === "forbidden") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const metadata = ownership.project.metadata as { runId?: unknown; processingStatus?: unknown } | null;
  if (metadata?.processingStatus === ProjectStatus.IN_PROGRESS) {
    return NextResponse.json(
      {
        runId: typeof metadata.runId === "string" ? metadata.runId : null,
        message: "Project processing is already in progress",
      },
      { status: 409 },
    );
  }

  const run = await start(processProjectFiles, [projectId, config]);

  console.log("Started run", run.runId);
  await updateProjectMetadata(projectId, {
    runId: run.runId,
    stage: ProjectStage.PARSING,
    processingStatus: ProjectStatus.IN_PROGRESS,
    processingStartedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    runId: run.runId,
    message: "Processing project files workflow started",
  });
}
