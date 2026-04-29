import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workspaceSurfaceFiles = [
  "src/components/projects/project-header-card.tsx",
  "src/components/projects/project-stats-cards.tsx",
  "src/components/projects/project-workflow-timeline.tsx",
  "src/components/projects/project-report-tab.tsx",
  "src/components/projects/project-files-tab.tsx",
  "src/components/projects/files-table.tsx",
  "src/components/projects/project-file-dropzone.tsx",
];

describe("project workspace UI visibility", () => {
  it("does not force dark-theme-only foreground colors on light workspace surfaces", () => {
    for (const filePath of workspaceSurfaceFiles) {
      const source = readFileSync(filePath, "utf8");

      expect(source, filePath).not.toContain("text-white");
      expect(source, filePath).not.toContain("text-emerald-100");
    }
  });

  it("keeps the shared card shadow subtle enough for the light workspace theme", () => {
    const source = readFileSync("src/components/ui/card.tsx", "utf8");

    expect(source).not.toContain("rgba(1,6,20,0.36)");
    expect(source).not.toContain("rgba(1,6,20,0.42)");
    expect(source).toContain("rgb(15_23_42_/_0.08)");
  });
});
