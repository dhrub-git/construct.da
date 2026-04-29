import { describe, expect, it } from "vitest";

import {
  buildRossStreetMasterViewFileSpecs,
  buildRossStreetMasterViewProjectMetadata,
  buildRossStreetMasterViewProjectSpecs,
  isRossStreetMasterViewApplicationUrl,
  ROSS_STREET_MASTER_VIEW_APPLICATION,
} from "@/lib/masterview/north-sydney";
import { ProjectStatus, ProjectType } from "@models/data";

const masterViewUrl = "https://masterview.northsydney.nsw.gov.au/Application/ApplicationDetails/010.2026.00000172.001/";

describe("North Sydney MasterView DA fixture", () => {
  it("recognizes the Ross Street application URL", () => {
    expect(isRossStreetMasterViewApplicationUrl(masterViewUrl)).toBe(true);
    expect(isRossStreetMasterViewApplicationUrl("https://example.com/ApplicationDetails/010.2026.00000172.001/")).toBe(false);
    expect(isRossStreetMasterViewApplicationUrl("not a url")).toBe(false);
  });

  it("builds project specs for the live council control case", () => {
    const project = buildRossStreetMasterViewProjectSpecs("user-1");

    expect(project.name).toContain("DA172/2026");
    expect(project.address).toBe("15A Ross Street, Waverton NSW 2060");
    expect(project.council).toBe("North Sydney Council");
    expect(project.type).toBe(ProjectType.HOME_EXTENSION);
    expect(project.files).toHaveLength(ROSS_STREET_MASTER_VIEW_APPLICATION.documents.length);
    expect(project.files.map((file) => file.fileType)).toContain("HERITAGE_REPORT");
    expect(project.files.map((file) => file.fileType)).toContain("STATEMENT_OF_ENVIRONMENTAL_EFFECTS");
  });

  it("captures no-clause-4.6 and heritage-adjacent metadata", () => {
    const metadata = buildRossStreetMasterViewProjectMetadata();

    expect(metadata.processingStatus).toBe(ProjectStatus.COMPLETED);
    expect(metadata.geoEncoding).toEqual({ lat: -33.8378342, lng: 151.1950263 });
    expect(metadata.masterView?.applicationNumber).toBe("10.2026.00000172.001");
    expect(metadata.planningFacts?.zoning).toBe("R2 Low Density Residential");
    expect(metadata.planningFacts?.heightControl).toBe("8.5 m");
    expect(metadata.clause46?.triggered).toBe(false);
    expect(metadata.clause46?.reason).toMatch(/SEE states/i);
    expect(metadata.spatialConstraints?.some((constraint) => constraint.id === "ross-street-heritage-adjacent")).toBe(true);
  });

  it("uses stable MasterView document links as file specs", () => {
    const files = buildRossStreetMasterViewFileSpecs("user-1");

    expect(files).toHaveLength(12);
    expect(files[0]).toEqual(expect.objectContaining({
      filename: expect.stringContaining("BASIX"),
      mimetype: "application/pdf",
      size: 0,
      userId: "user-1",
    }));
    expect(files[0]?.url).toContain("/document/download?key=folder-10829467");
  });
});
