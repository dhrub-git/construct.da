import { describe, expect, it } from "vitest";

import {
  AustralianState,
  bboxesIntersect,
  coordToAUStates,
  coordsToJurisdictions,
  getLayersForView,
  Jurisdiction,
  normalizeBBox,
  SpatialLayerType,
} from "@/lib/spatial";

describe("Australian spatial coverage helpers", () => {
  it("normalizes reversed bounding boxes", () => {
    expect(normalizeBBox({ minLat: -20, maxLat: -30, minLng: 150, maxLng: 140 })).toEqual({
      minLat: -30,
      minLng: 140,
      maxLat: -20,
      maxLng: 150,
    });
  });

  it("detects intersecting bounding boxes", () => {
    expect(bboxesIntersect(
      { minLat: -34, minLng: 151, maxLat: -33, maxLng: 152 },
      { minLat: -33.5, minLng: 151.5, maxLat: -32.5, maxLng: 152.5 },
    )).toBe(true);
    expect(bboxesIntersect(
      { minLat: -34, minLng: 151, maxLat: -33, maxLng: 152 },
      { minLat: -32, minLng: 153, maxLat: -31, maxLng: 154 },
    )).toBe(false);
  });

  it("detects ACT without duplicating it when NSW also intersects", () => {
    const states = coordToAUStates({ minLat: -35.4, minLng: 149.0, maxLat: -35.2, maxLng: 149.2 });

    expect(states).toContain(AustralianState.ACT);
    expect(states).toContain(AustralianState.NSW);
    expect(states.filter((state) => state === AustralianState.ACT)).toHaveLength(1);
  });

  it("detects supported Queensland local government jurisdictions", () => {
    expect(coordsToJurisdictions({ minLat: -27.7, minLng: 151.8, maxLat: -27.4, maxLng: 152.0 })).toContain(Jurisdiction.TOOWOOMBA);
    expect(coordsToJurisdictions({ minLat: -21.3, minLng: 149.0, maxLat: -21.0, maxLng: 149.3 })).toContain(Jurisdiction.MACKAY);
  });

  it("selects registry layers for the states visible in a view", () => {
    const nswLayers = getLayersForView(
      { minLat: -33.9, minLng: 151.1, maxLat: -33.7, maxLng: 151.3 },
      SpatialLayerType.LAND_ZONES,
    );
    const qldLayers = getLayersForView(
      { minLat: -27.7, minLng: 151.8, maxLat: -27.4, maxLng: 152.0 },
      SpatialLayerType.FLOOD_HAZARD,
    );

    expect(nswLayers.map((layer) => layer.id)).toContain("NSW_LAND_ZONING");
    expect(qldLayers.map((layer) => layer.id)).toContain("QLD_FLOOD_HAZARD");
  });

  it("does not map unsupported TAS or NT views to NSW fallback layers", () => {
    expect(getLayersForView(
      { minLat: -42.9, minLng: 147.2, maxLat: -42.7, maxLng: 147.4 },
      SpatialLayerType.LAND_ZONES,
    )).toEqual([]);
    expect(getLayersForView(
      { minLat: -12.6, minLng: 130.7, maxLat: -12.3, maxLng: 131.0 },
      SpatialLayerType.HERITAGE_ZONES,
    )).toEqual([]);
  });
  it("does not classify heritage services as SA bushfire hazard layers", () => {
    const saBushfireLayers = getLayersForView(
      { minLat: -35.0, minLng: 138.5, maxLat: -34.8, maxLng: 138.7 },
      SpatialLayerType.BUSHFIRE_HAZARD,
    );

    expect(saBushfireLayers).not.toEqual([]);
    expect(saBushfireLayers.every((layer) => !/heritage/i.test(`${layer.id} ${layer.name} ${layer.url}`))).toBe(true);
  });

});
