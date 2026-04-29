import { start } from "workflow/api";
import { generateProjectReport } from "@workflows/generate-project-report";
import { NextResponse } from "next/server";
import { ProjectStage } from "@/types/data";
import { updateProjectMetadata } from "@/lib/actions/projects";

export async function POST(request: Request) {
  const { projectId } = await request.json();

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