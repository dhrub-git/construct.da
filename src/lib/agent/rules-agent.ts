import { projectTypeSchema, rulesPackSchema, type ProjectContext, type RulesPack } from "@/lib/agent/types";
import { retrieveApplicableRulesTool } from "@/lib/agent/tools/retrieve-rules";
import { Output, tool, ToolLoopAgent } from 'ai';
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { retrieveProjectChunksTool } from "./tools/retrieve-project-chunks";

function buildRulesAgentPrompt(project: ProjectContext): string {
    return [
        "## Task",
        "Retrieve the full set of applicable planning rules for this development application.",
        "The rules you select will drive the downstream compliance check — missed rules mean missed findings, so err on the side of inclusion.",
        "",
        "## Project Attributes",
        `- Project ID: ${project.id}`,
        `- Name: ${project.name}`,
        `- Address: ${project.address || "unknown"}`,
        `- State: ${project.state || "unknown"}`,
        `- Council / LGA: ${project.council || "unknown"}`,
        `- Project Type: ${project.projectType || "unknown"}`,
        `- Zoning: ${project.zoning.length > 0 ? project.zoning.join(", ") : "unknown"}`,
        "",
        "## Instructions",
        "1. Start by calling getProjectFacts to surface any zoning details, overlays, or special constraints that are not captured in the attributes above (e.g. flood overlay, heritage listing, bushfire BAL, biodiversity, state referral triggers, secondary dwelling eligibility).",
        "2. Use retrieveApplicableRules to pull the relevant rule sets. Cover all applicable layers in order:",
        "   - National: NCC / BCA provisions relevant to the project type",
        "   - State: planning controls, SEPP/SEPP equivalents, exempt/complying pathway rules, state overlays",
        "   - Local: LEP / planning scheme zones, DCPs, local planning scheme policies, council checklists, overlay schedules",
        "3. If the initial rule retrieval is broad or misses a specific overlay or policy triggered by your project facts, call getProjectFacts again with a more targeted query, then call retrieveApplicableRules again to fill the gap.",
        "4. Continue iterating until you are confident the rule pack covers every layer relevant to this project — pathway eligibility, numeric development standards, document requirements, and overlay-specific controls.",
        "",
        "## Jurisdiction guidance",
        ...(project.state === "NSW" ? [
            "NSW: Model the LEP + SEPP + DCP interaction. Check BASIX triggers. Screen exempt/complying/DA pathway eligibility. Include council DCP and checklist requirements.",
        ] : []),
        ...(project.state === "VIC" ? [
            "VIC: Use VicPlan zone/overlay/property report outputs. Include clause 54/55 (ResCode) or clause 57 as applicable. Check VicSmart eligibility. Include relevant overlay schedules from the planning scheme.",
        ] : []),
        ...(project.state === "QLD" ? [
            "QLD: Pull the local planning scheme from the relevant council. Include state framework layers: DA Rules, SPP, SDAP, and any SARA triggers. Check planning scheme policies that apply to the zone and use type.",
        ] : []),
        "",
        "Return the complete rule pack as a structured object. Do not omit rules due to uncertainty — include them with an appropriate confidence or applicability flag if the schema supports it.",
    ].join("\n");
}

const RULES_AGENT_PROMPT = `
You are a planning compliance analyst for an Australian DA (Development Application) pre-lodgement advisory system covering NSW, Victoria, and Queensland.
 
Your role is to assemble a complete, layered rule pack for a development project. The rule pack feeds the compliance engine — every rule you omit is a compliance check that will never run, so thoroughness is essential.
 
## How to approach this task
 
### Step 1 — Discover hidden constraints with getProjectFacts
Before retrieving rules, query the project documents to surface constraints that the intake form may not have captured:
- Overlay triggers: flood, heritage, bushfire, biodiversity, acid sulfate soils, contaminated land, coastal
- Special land uses: secondary dwelling / granny flat eligibility, dual occupancy, subdivision potential
- State referral triggers (QLD SARA, NSW Minister's concurrence, VIC DELWP referrals)
- Existing non-conformities or prior approvals that affect rule applicability
- Site-specific constraints mentioned in survey, geotechnical, or ecological reports
 
Run targeted queries — e.g. "heritage overlay listing", "flood planning level constraint", "BASIX trigger residential", "SARA trigger referral", "secondary dwelling clause eligibility".
 
### Step 2 — Retrieve rules in layers
Call retrieveApplicableRules for each relevant layer. Do not rely on a single broad call:
- **National layer**: NCC / BCA sections relevant to the project type and construction class
- **State layer**: state environmental planning policies (NSW SEPP), state planning policies (QLD SPP/SDAP), VIC state provisions and clause 54/55/57
- **Local layer**: LEP zone objectives and development standards (NSW), planning scheme zone provisions (VIC/QLD), DCP controls, council application checklists, planning scheme policies, overlay schedules
- **Pathway layer**: exempt/complying/fast-track screening rules, VicSmart eligibility, code-assessable vs impact-assessable (QLD)
 
### Step 3 — Gap-check and iterate
After the initial retrieval, review the rule pack against the facts discovered in Step 1. Ask: "Is there a rule that governs this constraint?" If not, query for it specifically. Common gaps include:
- Overlay-specific development standards (e.g. flood freeboard, heritage streetscape controls, biodiversity offset thresholds)
- Referral agency requirements (e.g. RMS/TfNSW for access, water authority for servicing)
- Document requirement checklists that sit outside the primary planning instrument
 
Continue iterating until the rule pack is comprehensive for the project's jurisdiction, council, zoning, overlays, and project type.
 
## What NOT to do
- Do not stop after a single retrieveApplicableRules call if the project has overlays, special uses, or state referral triggers.
- Do not omit national (NCC) provisions for structural, fire, or energy efficiency matters.
- Do not assume the intake-provided zoning is complete — verify against project documents.
 
## Source hierarchy to respect (per PRD)
- Tier 1 (preferred): ABCB/NCC, official state planning/building portals, statutory planning scheme repositories, official spatial/property reports
- Tier 2: Council planning scheme pages, DCP pages, checklists, application guides, overlay maps, local policies
- Tier 3 (support only): internal annotations, analyst guidance — do not use as primary rule source
`;

const RULES_AGENT_STOP_SEQUENCES = [
    "RULE_RETRIEVAL_COMPLETE",
    "I have now retrieved all applicable rules",
    "The rule pack is complete",
    "No further rule retrieval is needed",
];

export async function runRulesAgent(project: ProjectContext): Promise<RulesPack> {
    try {
        const agent = new ToolLoopAgent({
            model: google("gemini-3-flash-preview"),
            tools: {
                retrieveApplicableRules: tool({
                    description: [
                        "Fetch planning rules applicable to the project from the rules knowledge base.",
                        "Call this once per distinct rule layer (national, state, local, pathway) rather than once for everything.",
                        "Be specific with zoning and overlays — a broad query may miss overlay-specific schedules.",
                    ].join(" "),
                    inputSchema: z.object({
                        query: z.string().describe("Specific query to retrieve relevant rules"),
                        state: z.string().describe("State or territory where the project is located"),
                        council: z.string().describe("Local council or municipality governing the project area"),
                        projectType: projectTypeSchema.describe("Type of development project (e.g., residential, commercial)"),
                        zoning: z.array(z.string()).describe("Zoning classifications applicable to the project site"),
                    }),
                    execute: async (input) => {
                        return await retrieveApplicableRulesTool(input);
                    }
                }),
                getProjectFacts: tool({
                    description: [
                        "Retrieve chunks from the project's uploaded documents to discover constraints, overlays, and characteristics not captured in the intake form.",
                        "Use targeted queries — e.g. 'heritage overlay', 'flood planning level', 'BASIX threshold', 'secondary dwelling eligibility', 'SARA referral trigger'.",
                        "Call this before and during rule retrieval to ensure the rule pack covers all discovered constraints.",
                    ].join(" "),
                    inputSchema: z.object({
                        query: z.string().describe("Specific query to retrieve relevant project facts"),
                        topK: z.number().int().min(1).max(50).default(10).describe("Number of relevant facts to retrieve"),
                    }),
                    execute: async (input) => {
                        return await retrieveProjectChunksTool({
                            projectId: project.id,
                            query: input.query,
                            topK: input.topK,
                        })
                    }
                })
            },
            toolChoice: "auto",
            output: Output.object({ schema: rulesPackSchema }),
            instructions: RULES_AGENT_PROMPT,
            stopSequences: RULES_AGENT_STOP_SEQUENCES,
        });

        const result = await agent.generate({ prompt: buildRulesAgentPrompt(project) });

        return result.output;
    } catch (error) {
        console.error("Error in runRulesFetchAgent:", error);
        throw error;
    }
}