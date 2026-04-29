import { start } from "workflow/api";
import { generateProjectReport } from "@workflows/generate-project-report";
import { NextResponse } from "next/server";
import { ProjectStage } from "@/types/data";
import { updateProjectMetadata } from "@/lib/actions/projects";
import { auth } from "@clerk/nextjs/server";
import { resolveProjectOwnership } from "@/lib/api/workflow-auth";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let projectId: string;
  try {
    const body = await request.json();
    projectId = body.projectId;
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
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

  const run = await start(generateProjectReport, [{ projectId }]);

  console.log("Started run", run.runId);
  await updateProjectMetadata(projectId, {
    runId: run.runId,
    stage: ProjectStage.COMPLIANCE_REVIEW,
  });

  return NextResponse.json({
    runId: run.runId,
    message: "Processing project files workflow started",
  });
}
