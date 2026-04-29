import { start } from "workflow/api";
import { processProjectFiles } from "@workflows/process-project-files";
import { NextResponse } from "next/server";
import { updateProjectMetadata } from "@/lib/actions/projects";
import { ProjectStage, ProjectStatus } from "@models/data";

export async function POST(request: Request) {
  const { projectId, config } = await request.json();

  // Executes asynchronously and doesn't block your app
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