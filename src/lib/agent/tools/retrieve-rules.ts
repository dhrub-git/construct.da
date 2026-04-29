import { getRelevantContentForQuery } from "@/lib/embedding";
import { projectTypeSchema, retrievedRuleSchema, type RulesPack } from "@/lib/agent/types";
import { z } from "zod";

const inputSchema = z.object({
  query: z.string(),
  state: z.string().nullable(),
  council: z.string().nullable(),
  projectType: projectTypeSchema,
  zoning: z.array(z.string()).default([]),
  topK: z.number().int().min(1).max(80).default(25),
});

export async function retrieveApplicableRulesTool(input: z.input<typeof inputSchema>): Promise<RulesPack> {
  const parsed = inputSchema.parse(input);

  const rows = await getRelevantContentForQuery(parsed.query, parsed.topK, {
    topic: "rule",
  });

  const normalized = rows
    .filter((row) => {
      const metadata = (row.metadata ?? {}) as Record<string, unknown>;
      const state = typeof metadata.state === "string" ? metadata.state : null;
      const council = typeof metadata.council === "string" ? metadata.council : null;
      const zoneCode = typeof metadata.zoneCode === "string" ? metadata.zoneCode : null;

      const stateMatch = !parsed.state || !state || state.toLowerCase() === parsed.state.toLowerCase();
      const councilMatch = !parsed.council || !council || council.toLowerCase().includes(parsed.council.toLowerCase());
      const zoningMatch =
        parsed.zoning.length === 0 ||
        !zoneCode ||
        parsed.zoning.some((zone) => zone.toLowerCase() === zoneCode.toLowerCase());

      return stateMatch && councilMatch && zoningMatch;
    })
    .map((row) =>
      retrievedRuleSchema.parse({
        id: row.id,
        title: row.title,
        content: row.content,
        source: row.source,
        clause: row.clause,
        zone: row.zone,
        topic: row.topic,
        vectorScore: row.vectorScore,
        bm25Score: row.bm25Score,
        hybridScore: row.hybridScore,
        metadata: row.metadata,
      })
    );

  return {
    query: parsed.query,
    appliedFilters: {
      state: parsed.state,
      council: parsed.council,
      projectType: parsed.projectType,
      zoning: parsed.zoning,
    },
    rules: normalized,
  };
}
