import { start } from "workflow/api";
import { handleIngestRuleFiles } from "@workflows/ingesting-rule-files";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  hasAdminRole,
  hasValidIngestionServiceToken,
} from "@/lib/api/workflow-auth";
import {
  IngestionConfigValidationError,
  parseIngestionRuntimeConfig,
} from "@/lib/workflows/ingestion-shared";

export async function POST(request: Request) {
  const authResult = await auth();
  const hasServiceToken = hasValidIngestionServiceToken(request);
  if (!authResult.isAuthenticated && !hasServiceToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!hasServiceToken && !hasAdminRole(authResult.sessionClaims)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let config: ReturnType<typeof parseIngestionRuntimeConfig>;
  try {
    const body = await request.json();
    config = parseIngestionRuntimeConfig(body.config);
  } catch (error) {
    const message = error instanceof IngestionConfigValidationError
      ? error.message
      : "Invalid request body";
    return NextResponse.json({ message }, { status: 400 });
  }

  const run = await start(handleIngestRuleFiles, [config]);

  console.log("Started run", run.runId);

  return NextResponse.json({
    runId: run.runId,
    message: "Ingesting rule files workflow started",
  });
}
