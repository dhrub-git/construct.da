import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import {
  extractedFactsSchema,
  type ExtractedFacts,
  type ProjectContext,
  type RulesPack,
} from "@/lib/agent/types";
import { type ProjectChunk } from "@/lib/agent/tools/retrieve-project-chunks";

function formatChunks(chunks: ProjectChunk[]): string {
  return chunks
    .slice(0, 30)
    .map((chunk, index) => {
      const title = chunk.title ? `title=${chunk.title}` : "title=unknown";
      const page = chunk.pageNumber ? `page=${chunk.pageNumber}` : "page=unknown";
      return `chunk_${index + 1} (${title}, ${page}):\n${chunk.content}`;
    })
    .join("\n\n");
}

export function formatRules(rules: RulesPack): string {
  return rules.rules
    .slice(0, 20)
    .map((rule, index) => {
      const head = [rule.clause, rule.zone, rule.topic].filter(Boolean).join(" | ");
      return `rule_${index + 1} (${head || "general"}): ${rule.content}`;
    })
    .join("\n");
}

export async function extractStructuredFactsTool(input: {
  project: ProjectContext;
  chunks: ProjectChunk[];
  rules: RulesPack;
}): Promise<ExtractedFacts> {
  const { project, chunks, rules } = input;

  if (chunks.length === 0) {
    return extractedFactsSchema.parse({
      siteArea: null,
      frontage: null,
      setbacks: {},
      height: null,
      floorArea: null,
      fsr: null,
      overlays: project.overlays,
      parking: null,
      bedrooms: null,
      missingConsultantDocs: [],
      detectedReports: project.documents.map((document) => document.fileType).filter(Boolean),
      confidence: 0,
      notes: "No project chunks were available for extraction.",
    });
  }

  const prompt = [
    "Extract planning compliance facts from project documents.",
    "Return null for any value you cannot support with evidence.",
    "Numbers must be plain numeric values (no units).",
    `Project:\n${JSON.stringify(project, null, 2)}`,
    `Applicable Rules:\n${formatRules(rules)}`,
    `Project Chunks:\n${formatChunks(chunks)}`,
  ].join("\n\n");

  const { output } = await generateText({
    model: google("gemini-3-flash-preview"),
    output: Output.object({ schema: extractedFactsSchema }),
    prompt,
    maxOutputTokens: 2500,
  });

  return extractedFactsSchema.parse(output);
}
