import { getRelevantContentForQuery } from "@/lib/embedding";
import { z } from "zod";

const inputSchema = z.object({
  projectId: z.string(),
  query: z.string().min(3).default("project compliance facts and measurements"),
  topK: z.number().int().min(1).max(80).default(40),
});

const projectChunkSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  content: z.string(),
  source: z.string().nullable(),
  clause: z.string().nullable(),
  topic: z.string().nullable(),
  pageNumber: z.number().nullable(),
  hybridScore: z.number(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

export type ProjectChunk = z.infer<typeof projectChunkSchema>;

export async function retrieveProjectChunksTool(input: z.input<typeof inputSchema>): Promise<ProjectChunk[]> {
  const parsed = inputSchema.parse(input);

  const rows = await getRelevantContentForQuery(parsed.query, parsed.topK, {
    projectId: parsed.projectId,
  });

  return rows.map((row) =>
    projectChunkSchema.parse({
      id: row.id,
      title: row.title,
      content: row.content,
      source: row.source,
      clause: row.clause,
      topic: row.topic,
      pageNumber: row.pageNumber,
      hybridScore: row.hybridScore,
      metadata: row.metadata,
    })
  );
}
