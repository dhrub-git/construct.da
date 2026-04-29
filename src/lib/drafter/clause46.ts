export type Clause46DraftInput = {
  council: string;
  address: string;
  developmentStandard: string;
  controlLimit: string;
  proposedValue: string;
  variationPercent: number;
  objectives: string[];
  environmentalPlanningGrounds: string[];
};

export type Clause46Draft = {
  title: string;
  lppRequired: boolean;
  markdown: string;
  sections: Array<{ heading: string; body: string }>;
};

export const CLAUSE_46_SECTION_HEADINGS = [
  "1. Identify development standard",
  "2. Quantify contravention",
  "3. Clause 4.6(3)(a) — unreasonable or unnecessary",
  "4. Wehbe Way 1 — objectives achieved notwithstanding non-compliance",
  "5. Clause 4.6(3)(b) — sufficient environmental planning grounds",
  "6. Initial Action / Four2Five specificity note",
  "7. Public interest and zone objectives",
  "8. Advisory disclaimer",
] as const;

export const DEFAULT_CLAUSE_46_DRAFT_INPUT: Clause46DraftInput = {
  council: "Sample Council",
  address: "1 Example Street, Example NSW 2000",
  developmentStandard: "Maximum building height under cl. 4.3",
  controlLimit: "8.5 m",
  proposedValue: "9.6 m",
  variationPercent: 12.9,
  objectives: [
    "maintain compatible residential scale and streetscape character",
    "minimise overshadowing and privacy impacts to adjoining properties",
    "support orderly development that responds to site constraints",
  ],
  environmentalPlanningGrounds: [
    "the exceedance is confined to the roof form and does not materially increase visual bulk at the street edge",
    "floor levels respond to the sloping site and reduce excavation compared with a fully compliant stepped alternative",
    "shadow and privacy impacts remain within the advisory assessment tolerances shown in the uploaded plans",
  ],
};

const MARKDOWN_BULLET_INDENT = "- ";

function cleanText(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function cleanList(values: string[], fallback: string): string[] {
  const items = values.map((value) => value.trim()).filter(Boolean);
  return items.length > 0 ? items : [fallback];
}

function formatVariationPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function bulletList(values: string[]): string {
  return values.map((value) => `${MARKDOWN_BULLET_INDENT}${value}`).join("\n");
}

export function buildClause46DraftFileName(input: Clause46DraftInput): string {
  const addressSlug = cleanText(input.address, "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  return `clause-4-6-${addressSlug || "project"}.md`;
}

export function buildClause46Draft(input: Clause46DraftInput = DEFAULT_CLAUSE_46_DRAFT_INPUT): Clause46Draft {
  const council = cleanText(input.council, "the consent authority");
  const address = cleanText(input.address, "the site");
  const developmentStandard = cleanText(input.developmentStandard, "the relevant development standard");
  const controlLimit = cleanText(input.controlLimit, "the mapped control limit");
  const proposedValue = cleanText(input.proposedValue, "the proposed value");
  const objectives = cleanList(
    input.objectives,
    "the proposal is capable of satisfying the relevant objectives despite the numerical departure",
  );
  const environmentalPlanningGrounds = cleanList(
    input.environmentalPlanningGrounds,
    "site-specific environmental planning grounds should be confirmed by the project planner before lodgement",
  );
  const variationPercent = formatVariationPercent(input.variationPercent);
  const lppRequired = input.variationPercent > 10;
  const title = `Draft cl. 4.6 variation request — ${address}`;

  const sections: Clause46Draft["sections"] = [
    {
      heading: CLAUSE_46_SECTION_HEADINGS[0],
      body: `${council} should identify ${developmentStandard} as the development standard sought to be varied for ${address}. The draft request should cite the applicable local environmental plan clause and attach the plan or calculation sheet used to measure the standard.`,
    },
    {
      heading: CLAUSE_46_SECTION_HEADINGS[1],
      body: `The mapped control limit is ${controlLimit}. The proposal is assessed at ${proposedValue}, which is a ${variationPercent} variation to the numerical standard. ${lppRequired ? "Because the variation is greater than 10%, the draft flags likely Local Planning Panel review before determination." : "Because the variation is not greater than 10%, this draft does not automatically flag Local Planning Panel review on the variation threshold alone."}`,
    },
    {
      heading: CLAUSE_46_SECTION_HEADINGS[2],
      body: `Compliance with ${developmentStandard} is considered unreasonable or unnecessary in the circumstances because the proposal can satisfy the planning intent of the control without strict numerical compliance. The request should tie this conclusion to the project drawings, streetscape response, and measured amenity impacts rather than relying on general preference.`,
    },
    {
      heading: CLAUSE_46_SECTION_HEADINGS[3],
      body: `The Wehbe Way 1 pathway is addressed by showing that the objectives of the development standard are achieved notwithstanding the non-compliance:\n${bulletList(objectives)}`,
    },
    {
      heading: CLAUSE_46_SECTION_HEADINGS[4],
      body: `The following site-specific environmental planning grounds are relied on for cl. 4.6(3)(b):\n${bulletList(environmentalPlanningGrounds)}`,
    },
    {
      heading: CLAUSE_46_SECTION_HEADINGS[5],
      body: "Initial Action and Four2Five require the grounds to be particular to the site and proposed development. Replace any generic statements with evidence from the submitted survey, architectural plans, shadow diagrams, view analysis, flood/heritage/bushfire overlays, and planning report before lodgement.",
    },
    {
      heading: CLAUSE_46_SECTION_HEADINGS[6],
      body: "The consent authority may be satisfied that the development remains in the public interest if it is consistent with the objectives of the development standard and the objectives of the zone. Insert the relevant zone objectives and explain how the proposal maintains the desired future character, amenity, and orderly development outcomes.",
    },
    {
      heading: CLAUSE_46_SECTION_HEADINGS[7],
      body: "This is a deterministic advisory draft generated from fixture/project data. It is not legal advice and must be reviewed by a qualified NSW planning professional before lodgement.",
    },
  ];

  const markdown = [
    `# ${title}`,
    "",
    `Council: ${council}`,
    `Address: ${address}`,
    `Development standard: ${developmentStandard}`,
    `Control limit: ${controlLimit}`,
    `Proposed value: ${proposedValue}`,
    `Variation: ${variationPercent}`,
    `Local Planning Panel threshold flag: ${lppRequired ? "Yes — variation is greater than 10%" : "No — variation is not greater than 10%"}`,
    "",
    ...sections.flatMap((section) => [`## ${section.heading}`, "", section.body, ""]),
  ].join("\n").trimEnd();

  return {
    title,
    lppRequired,
    markdown,
    sections,
  };
}
