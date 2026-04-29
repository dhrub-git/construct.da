import { describe, expect, it, vi } from "vitest";

import {
  buildArcGisPointQueryUrl,
  getSpatialConstraintsForPoint,
  normalizeArcGisFeatureCollection,
  NSW_PLANNING_ARCGIS_LAYERS,
  SpatialConstraintCategory,
  SpatialConstraintSource,
  SpatialConstraintStatus,
  type ArcGisLayerConfig,
} from "@/lib/spatial";

const layer: ArcGisLayerConfig = {
  id: "test-zoning",
  label: "Test zoning layer",
  url: "https://example.test/arcgis/rest/services/planning/MapServer/0/query",
  category: SpatialConstraintCategory.ZONING,
  severity: "info",
};

describe("ArcGIS spatial helpers", () => {

  it("uses currently reachable NSW EPI primary planning layers by default", () => {
    const defaults = NSW_PLANNING_ARCGIS_LAYERS.map((item) => item.url);

    expect(defaults).toContain("https://mapprod1.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/2/query");
    expect(defaults).toContain("https://mapprod1.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/5/query");
    expect(defaults).toContain("https://mapprod1.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/0/query");
  });
  it("builds point query URLs with ArcGIS spatial parameters", () => {
    const url = new URL(buildArcGisPointQueryUrl(layer.url, { lat: -33.871, lng: 151.207 }));

    expect(url.searchParams.get("f")).toBe("geojson");
    expect(url.searchParams.get("geometryType")).toBe("esriGeometryPoint");
    expect(url.searchParams.get("spatialRel")).toBe("esriSpatialRelIntersects");
    expect(url.searchParams.get("inSR")).toBe("4326");
    expect(url.searchParams.get("outSR")).toBe("4326");
    expect(JSON.parse(url.searchParams.get("geometry") ?? "{}")).toEqual({
      x: 151.207,
      y: -33.871,
      spatialReference: { wkid: 4326 },
    });
  });

  it("normalizes GeoJSON features into spatial constraints and geometries", () => {
    const result = normalizeArcGisFeatureCollection(
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              OBJECTID: 7,
              ZONE_CODE: "R2 Low Density Residential",
              LAYER: "Land zoning",
            },
            geometry: {
              type: "Polygon",
              coordinates: [[[151.2, -33.8], [151.21, -33.8], [151.21, -33.81], [151.2, -33.8]]],
            },
          },
        ],
      },
      layer,
      "2026-04-29T00:00:00.000Z",
      "https://example.test/query?f=geojson",
    );

    expect(result.constraints).toEqual([
      expect.objectContaining({
        id: "test-zoning-7",
        category: SpatialConstraintCategory.ZONING,
        label: "Land zoning",
        value: "R2 Low Density Residential",
        status: SpatialConstraintStatus.CONFIRMED,
        source: expect.objectContaining({ type: SpatialConstraintSource.ARCGIS }),
      }),
    ]);
    expect(result.geometries).toEqual([
      expect.objectContaining({
        constraintId: "test-zoning-7",
        category: SpatialConstraintCategory.ZONING,
      }),
    ]);
  });

  it("falls back to deterministic fixtures when ArcGIS fetch fails", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;

    const result = await getSpatialConstraintsForPoint({
      point: { lat: -33.871, lng: 151.207 },
      address: "1 Demo Street",
      council: "Demo Council",
      layers: [layer],
      fetchImpl,
    });

    expect(result.source).toBe("fixture");
    expect(result.constraints.map((constraint) => constraint.id)).toContain("fixture-zoning");
    expect(result.constraints[0]?.source.type).toBe(SpatialConstraintSource.FIXTURE);
  });

  it("returns live ArcGIS results when a layer fetch succeeds", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { OBJECTID: 3, ZONE_CODE: "E1 Local Centre" },
          geometry: { type: "Point", coordinates: [151.207, -33.871] },
        },
      ],
    }), { status: 200 })) as unknown as typeof fetch;

    const result = await getSpatialConstraintsForPoint({
      point: { lat: -33.871, lng: 151.207 },
      address: "1 Demo Street",
      council: "Demo Council",
      layers: [layer],
      fetchImpl,
    });

    expect(result.source).toBe("arcgis");
    expect(result.constraints).toHaveLength(1);
    expect(result.constraints[0]).toEqual(expect.objectContaining({ value: "E1 Local Centre" }));
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining("geometryType=esriGeometryPoint"),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
