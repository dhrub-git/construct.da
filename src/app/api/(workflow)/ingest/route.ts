import { start } from "workflow/api";
import { handleIngestRuleFiles } from "@workflows/ingesting-rule-files";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let config;
  try {
    ({ config } = await request.json());
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  // Executes asynchronously and doesn't block your app
  const run = await start(handleIngestRuleFiles, [config]);

  console.log("Started run", run.runId);

  return NextResponse.json({
    runId: run.runId,
    message: "Ingesting rule files workflow started",
  });
}
