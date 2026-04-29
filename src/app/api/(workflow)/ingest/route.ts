import { start } from "workflow/api";
import { handleIngestRuleFiles } from "@workflows/ingesting-rule-files";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { config } = await request.json();

  // Executes asynchronously and doesn't block your app
  const run = await start(handleIngestRuleFiles, [config]);

  console.log("Started run", run.runId);

  return NextResponse.json({
    runId: run.runId,
    message: "Ingesting rule files workflow started",
  });
}