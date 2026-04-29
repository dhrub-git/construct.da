import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import {
  reportSummarySchema,
  type ChecksResult,
  type ExtractedFacts,
  type ProjectContext,
  type ReportSummary,
  type RulesPack,
} from "@/lib/agent/types";

const SUMMARY_MODEL = "gemini-2.5-pro";

export async function generateSummaryTool(input: {
  project: ProjectContext;
  rules: RulesPack;
  facts: ExtractedFacts;
  checks: ChecksResult;
}): Promise<ReportSummary> {
  const prompt = [
    "Create an advisory compliance summary for a development application project.",
    "Be concise, factual, and risk-oriented.",
    "Do not invent controls that are not in the provided data.",
    `Project:\n${JSON.stringify(input.project, null, 2)}`,
    `Rules:\n${JSON.stringify(input.rules, null, 2)}`,
    `Facts:\n${JSON.stringify(input.facts, null, 2)}`,
    `Checks:\n${JSON.stringify(input.checks, null, 2)}`,
  ].join("\n\n");

  const { output } = await generateText({
    model: google(SUMMARY_MODEL),
    output: Output.object({ schema: reportSummarySchema }),
    prompt,
    maxOutputTokens: 2200,
  });

  return reportSummarySchema.parse(output);
}
