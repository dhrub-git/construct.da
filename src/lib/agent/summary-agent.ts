import {
  type ChecksResult,
  type ExtractedFacts,
  type ProjectContext,
  type ReportSummary,
  type RulesPack,
} from "@/lib/agent/types";
import { generateSummaryTool } from "@/lib/agent/tools/generate-summary";

export async function runSummaryAgent(input: {
  project: ProjectContext;
  rules: RulesPack;
  facts: ExtractedFacts;
  checks: ChecksResult;
}): Promise<ReportSummary> {
  return generateSummaryTool(input);
}
