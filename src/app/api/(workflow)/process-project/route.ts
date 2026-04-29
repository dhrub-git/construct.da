import { start } from "workflow/api";
import { processProjectFiles } from "@workflows/process-project-files";
import { NextResponse } from "next/server";
import { updateProjectMetadata } from "@/lib/actions/projects";
import { ProjectStage, ProjectStatus } from "@models/data";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let projectId: string;
  let config: Parameters<typeof processProjectFiles>[1];
  try {
    const body = await request.json();
    projectId = body.projectId;
    config = body.config;
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json({ message: "projectId is required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });
  if (!project) {
    return NextResponse.json({ message: "Project not found" }, { status: 404 });
  }
  if (project.userId !== userId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

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
