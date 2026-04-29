import { describe, expect, it } from "vitest";

import {
  buildClause46Draft,
  buildClause46DraftFileName,
  CLAUSE_46_SECTION_HEADINGS,
  DEFAULT_CLAUSE_46_DRAFT_INPUT,
  type Clause46DraftInput,
} from "@/lib/drafter/clause46";

const baseInput: Clause46DraftInput = {
  ...DEFAULT_CLAUSE_46_DRAFT_INPUT,
  address: "24 Test Avenue, Marrickville NSW 2204",
  council: "Inner West Council",
  variationPercent: 9.8,
};

describe("clause 4.6 drafter", () => {
  it("builds a deterministic draft shape and markdown artifact", () => {
    const draft = buildClause46Draft(baseInput);

    expect(draft.title).toBe("Draft cl. 4.6 variation request — 24 Test Avenue, Marrickville NSW 2204");
    expect(draft.lppRequired).toBe(false);
    expect(draft.sections).toHaveLength(CLAUSE_46_SECTION_HEADINGS.length);
    expect(draft.markdown).toContain("# Draft cl. 4.6 variation request");
    expect(draft.markdown).toContain("Council: Inner West Council");
    expect(draft.markdown).toContain("Variation: 9.8%");
  });

  it("keeps case-law sections in the required order", () => {
    const draft = buildClause46Draft(baseInput);

    expect(draft.sections.map((section) => section.heading)).toEqual([...CLAUSE_46_SECTION_HEADINGS]);
    expect(draft.markdown.indexOf("## 3. Clause 4.6(3)(a)")).toBeLessThan(
      draft.markdown.indexOf("## 4. Wehbe Way 1"),
    );
    expect(draft.markdown.indexOf("## 4. Wehbe Way 1")).toBeLessThan(
      draft.markdown.indexOf("## 5. Clause 4.6(3)(b)"),
    );
    expect(draft.markdown.indexOf("## 5. Clause 4.6(3)(b)")).toBeLessThan(
      draft.markdown.indexOf("## 6. Initial Action / Four2Five"),
    );
  });

  it("flags Local Planning Panel review only when the variation is greater than ten percent", () => {
    expect(buildClause46Draft({ ...baseInput, variationPercent: 10 }).lppRequired).toBe(false);
    expect(buildClause46Draft({ ...baseInput, variationPercent: 10.1 }).lppRequired).toBe(true);
    expect(buildClause46Draft({ ...baseInput, variationPercent: 10.1 }).markdown).toContain(
      "Local Planning Panel threshold flag: Yes",
    );
  });

  it("creates a stable markdown filename from the project address", () => {
    expect(buildClause46DraftFileName(baseInput)).toBe("clause-4-6-24-test-avenue-marrickville-nsw-2204.md");
  });
});
