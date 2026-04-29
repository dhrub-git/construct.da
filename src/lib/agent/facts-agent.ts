import { extractedFactsSchema, type ExtractedFacts, type ProjectContext, type RulesPack } from "@/lib/agent/types";
import { retrieveProjectChunksTool } from "@/lib/agent/tools/retrieve-project-chunks";
import { formatRules } from "@/lib/agent/tools/extract-structured-facts";
import { Output, tool, ToolLoopAgent } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const FACTS_AGENT_PROMPT = `
You are a planning compliance analyst for an Australian DA (Development Application) pre-lodgement advisory checker covering NSW, Victoria, and Queensland.
 
Your task is to extract structured, evidence-backed facts from a development project's uploaded documents. These facts will drive downstream compliance checks against planning rules, so completeness and accuracy are critical.
 
## How to approach this task
 
### Step 1 — Understand the rule context first
Review the applicable rules provided. Identify every fact they require as input (e.g. site area, gross floor area, wall height, setbacks, lot width, lot coverage, parking count, flood or heritage overlay presence). Use this as your extraction checklist — if a rule needs it, you must try to find it.
 
### Step 2 — Retrieve project data systematically
Use the "fetchProjectData" tool to pull document chunks for each fact on your checklist. Do not rely solely on the initial project context — plans, reports, and forms in the uploaded documents frequently contain the precise measurements and conditions you need. Aim to cover:
 
- Site characteristics: site area, lot dimensions, frontage, slope, orientation
- Existing conditions: current use, existing structures, vegetation, easements
- Proposed development: building footprint, number of storeys, wall height, overall height, setbacks (front, rear, side), gross floor area (GFA), floor space ratio (FSR), lot coverage percentage, number of dwellings or units
- Infrastructure and services: parking spaces provided, driveway width, stormwater, waste storage
- Overlay and constraint triggers: flood planning level, bushfire attack level (BAL), heritage listing, biodiversity, contamination
- Compliance indicators: BASIX certificate present (NSW), energy rating, structural engineer's report, shadow diagrams, landscape plan, traffic report
 
Run multiple targeted queries rather than one broad query. For example: query separately for "site area lot dimensions", "building height storeys", "setback front rear side", "floor area GFA FSR", "parking spaces", "BASIX certificate", "heritage overlay", "flood level". Retrieve more chunks (topK 15–30) for complex projects or when initial results are sparse.
 
### Step 3 — Quality-check your extraction
Before returning your output:
- Confirm every numeric fact has a source in the retrieved chunks (do not infer dimensions from scale bars or assume standard values).
- Return null for any value you cannot directly support with evidence — a null is far safer than a plausible guess.
- All numeric values must be plain numbers without units (e.g. 450 not "450 m²").
- Flag any critical fact that is missing from the documents so the compliance engine can raise a document-gap finding.
 
## What NOT to do
- Do not assume standard or typical values when a document value is absent.
- Do not infer height from number of storeys or vice versa unless the document states both.
- Do not combine values from different documents without noting the source ambiguity.
- Do not stop retrieving after one or two tool calls if key facts are still unresolved.
 
## Output rules
Return a single structured object matching the extractedFacts schema. Numbers must be plain numeric values (no units, no ranges — use the most specific/confirmed figure). Use null for any fact you cannot confirm with evidence.
`;

const FACTS_AGENT_STOP_SEQUENCES = [
    "EXTRACTION_COMPLETE",
    "I have now extracted all available facts",
    "No further tool calls are needed",
];

export async function runFactsAgent(input: {
    project: ProjectContext;
    rules: RulesPack;
}): Promise<{ facts: ExtractedFacts; chunkCount: number }> {

    let chunkCount = 0;

    const prompt = [
        "## Task",
        "Extract planning compliance facts from this development project's uploaded documents.",
        "You are preparing inputs for a DA pre-lodgement advisory compliance check (NSW/VIC/QLD).",
        "",
        "## Instructions",
        "- Return null for any value you cannot support with direct evidence from the retrieved chunks.",
        "- All numeric values must be plain numbers with no units (e.g. 450 not '450 m²').",
        "- Run multiple targeted fetchProjectData queries — do not stop until you have covered every fact required by the applicable rules below.",
        "- If a required document (e.g. BASIX certificate, shadow diagrams, flood report) appears to be missing, still return null for its associated facts so the compliance engine can flag the gap.",
        "",
        "## Project Context",
        JSON.stringify(input.project, null, 2),
        "",
        "## Applicable Rules (use these to drive your extraction checklist)",
        formatRules(input.rules),
    ].join("\n");

    const agent = new ToolLoopAgent({
        model: google("gemini-3-flash-preview"),
        tools: {
            fetchProjectData: tool({
                description: [
                    "Retrieve chunks from the project's uploaded documents (plans, reports, forms, certificates).",
                    "Use targeted, specific queries — e.g. 'site area lot dimensions', 'front setback distance', 'BASIX certificate number', 'heritage overlay schedule'.",
                    "Run separate queries for each category of fact rather than one broad query.",
                    "Use higher topK (15–30) when initial results are sparse or when the document set is large.",
                ].join(" "),
                inputSchema: z.object({
                    query: z.string().describe("Specific query to retrieve relevant project facts"),
                    topK: z.number().int().min(1).max(50).default(10).describe("Number of relevant facts to retrieve"),
                }),
                execute: async (agentInput) => {
                    const chunks = await retrieveProjectChunksTool({
                        projectId: input.project.id,
                        query: agentInput.query,
                        topK: agentInput.topK,
                    })
                    chunkCount += chunks.length;
                    return chunks;
                }
            }),
        },
        output: Output.object({ schema: extractedFactsSchema }),
        toolChoice: "auto",
        instructions: FACTS_AGENT_PROMPT,
        stopSequences: FACTS_AGENT_STOP_SEQUENCES,
    })

    const result = await agent.generate({ prompt });

    return {
        facts: result.output,
        chunkCount,
    };
}
