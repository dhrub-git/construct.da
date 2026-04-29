import {
  buildFixtureSpatialConstraints,
  SpatialConstraintCategory,
  SpatialConstraintSeverity,
  SpatialConstraintSource,
  SpatialConstraintStatus,
  type SpatialConstraint,
  type SpatialConstraintSourceMetadata,
} from "@/lib/spatial/constraints";
import { getLayersForPoint } from "@/lib/spatial/layers";

export type SpatialPoint = {
  lat: number;
  lng: number;
};

export type SpatialConstraintGeometry = {
  type: "Point" | "Polygon" | "MultiPolygon";
  coordinates: unknown;
};

export type SpatialLayerGeometry = {
  id: string;
  constraintId: string;
  category: SpatialConstraint["category"];
  geometry: SpatialConstraintGeometry;
};

export type SpatialLayerResult = {
  constraints: SpatialConstraint[];
  geometries: SpatialLayerGeometry[];
  source: "arcgis" | "fixture";
  loadedAt: string;
};

export type ArcGisLayerConfig = {
  id: string;
  label: string;
  url: string;
  category: SpatialConstraint["category"];
  severity: SpatialConstraint["severity"];
  propertyKey?: string[];
  labelKey?: string;
  whereClause?: string;
};

type ArcGisFeature = {
  type?: string;
  properties?: Record<string, unknown> | null;
  attributes?: Record<string, unknown> | null;
  geometry?: SpatialConstraintGeometry | null;
};

type ArcGisFeatureCollection = {
  type?: string;
  features?: ArcGisFeature[];
};

const DEFAULT_TIMEOUT_MS = 4_000;

export const NSW_PLANNING_ARCGIS_LAYERS: ArcGisLayerConfig[] = [
  {
    id: "NSW_LAND_ZONING",
    label: "NSW Land Zoning",
    category: SpatialConstraintCategory.ZONING,
    severity: SpatialConstraintSeverity.INFO,
    propertyKey: ["OBJECTID", "EPI_NAME", "LGA_NAME", "LAY_CLASS", "SYM_CODE", "PURPOSE", "EPI_TYPE"],
    labelKey: "LAY_CLASS",
    url: "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/2",
  },
  {
    id: "NSW_FLOOD_HAZARD",
    label: "NSW Flood Hazard",
    category: SpatialConstraintCategory.FLOOD,
    severity: SpatialConstraintSeverity.MEDIUM,
    propertyKey: ["OBJECTID", "EPI_NAME", "LGA_NAME", "LAY_CLASS", "COMMENT", "EPI_TYPE"],
    labelKey: "LAY_CLASS",
    url: "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/Hazard/MapServer/1",
  },
  {
    id: "NSW_HERITAGE_ZONES",
    label: "NSW Heritage Zones",
    category: SpatialConstraintCategory.HERITAGE,
    severity: SpatialConstraintSeverity.LOW,
    propertyKey: ["OBJECTID", "EPI_NAME", "LGA_NAME", "LAY_CLASS", "H_ID", "H_NAME", "SIG", "EPI_TYPE"],
    labelKey: "LAY_CLASS",
    url: "https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Planning/EPI_Primary_Planning_Layers/MapServer/0",
  },
];

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function stringProperty(properties: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return fallback;
}

function optionalStringProperty(properties: Record<string, unknown>, keys: string[]): string | undefined {
  const value = stringProperty(properties, keys, "");
  return value.length > 0 ? value : undefined;
}

function stableId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function arcGisQueryEndpoint(layerUrl: string): string {
  return layerUrl.endsWith("/query") ? layerUrl : `${layerUrl.replace(/\/$/, "")}/query`;
}

export function buildArcGisPointQueryUrl(
  layerUrl: string,
  point: SpatialPoint,
  layer?: Pick<ArcGisLayerConfig, "propertyKey" | "whereClause">,
): string {
  const url = new URL(arcGisQueryEndpoint(layerUrl));
  url.searchParams.set("f", "geojson");
  url.searchParams.set("where", layer?.whereClause ?? "1=1");
  url.searchParams.set("outFields", layer?.propertyKey?.length ? layer.propertyKey.join(",") : "*");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("geometryType", "esriGeometryPoint");
  url.searchParams.set("geometry", JSON.stringify({
    x: point.lng,
    y: point.lat,
    spatialReference: { wkid: 4326 },
  }));
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");

  return url.toString();
}

export function normalizeArcGisFeature(
  feature: ArcGisFeature,
  layer: ArcGisLayerConfig,
  retrievedAt: string,
  sourceUrl: string,
  index = 0,
): { constraint: SpatialConstraint; geometry?: SpatialLayerGeometry } | null {
  const properties = feature.properties ?? feature.attributes ?? {};
  const valueKeys = [
    ...(layer.labelKey ? [layer.labelKey] : []),
    "label",
    "name",
    "NAME",
    "zone",
    "ZONE",
    "ZONE_CODE",
    "EPI_NAME",
    "HEIGHT",
    "MAX_B_H",
    "HOB",
    "HERITAGE_ITEM",
  ];
  const value = stringProperty(properties, valueKeys, "Mapped overlay intersects the site");
  const title = stringProperty(properties, ["title", "TITLE", "layer", "LAYER"], layer.label);
  const objectId = stringProperty(properties, ["OBJECTID", "objectid", "fid", "FID", "id"], `${index + 1}`);
  const id = `${layer.id}-${stableId(objectId) || index + 1}`;
  const source: SpatialConstraintSourceMetadata = {
    type: SpatialConstraintSource.ARCGIS,
    label: layer.label,
    confidence: "high",
    retrievedAt,
    url: sourceUrl,
  };
  const constraint: SpatialConstraint = {
    id,
    category: layer.category,
    label: title,
    value,
    description: optionalStringProperty(properties, ["description", "DESCRIPTION", "desc", "DESC"]),
    severity: layer.severity,
    status: SpatialConstraintStatus.CONFIRMED,
    source,
    evidence: [sourceUrl],
  };

  const geometry = feature.geometry
    ? {
        id: `${id}-geometry`,
        constraintId: id,
        category: layer.category,
        geometry: feature.geometry,
      }
    : undefined;

  return { constraint, geometry };
}

export function normalizeArcGisFeatureCollection(
  collection: ArcGisFeatureCollection,
  layer: ArcGisLayerConfig,
  retrievedAt: string,
  sourceUrl: string,
): Pick<SpatialLayerResult, "constraints" | "geometries"> {
  const features = Array.isArray(collection.features) ? collection.features : [];
  const normalized = features
    .map((feature, index) => normalizeArcGisFeature(feature, layer, retrievedAt, sourceUrl, index))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    constraints: normalized.map((item) => item.constraint),
    geometries: normalized.flatMap((item) => item.geometry ? [item.geometry] : []),
  };
}

async function fetchLayer(
  layer: ArcGisLayerConfig,
  point: SpatialPoint,
  options: { signal: AbortSignal; retrievedAt: string; fetchImpl?: typeof fetch },
): Promise<Pick<SpatialLayerResult, "constraints" | "geometries">> {
  const queryUrl = buildArcGisPointQueryUrl(layer.url, point, layer);
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(queryUrl, {
    headers: { accept: "application/geo+json, application/json" },
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`ArcGIS ${layer.id} failed with ${response.status}`);
  }

  const payload = await response.json() as ArcGisFeatureCollection;
  return normalizeArcGisFeatureCollection(payload, layer, options.retrievedAt, queryUrl);
}

export async function getSpatialConstraintsForPoint(input: {
  point: SpatialPoint;
  address: string;
  council: string;
  layers?: ArcGisLayerConfig[];
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<SpatialLayerResult> {
  if (!isFiniteCoordinate(input.point.lat) || !isFiniteCoordinate(input.point.lng)) {
    return buildFixtureSpatialLayerResult(input);
  }

  const retrievedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const layers = input.layers ?? getLayersForPoint(input.point);

  try {
    const settledLayerResults = await Promise.allSettled(
      layers.map((layer) => fetchLayer(layer, input.point, {
        signal: controller.signal,
        retrievedAt,
        fetchImpl: input.fetchImpl,
      })),
    );
    const layerResults = settledLayerResults.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
    const constraints = layerResults.flatMap((result) => result.constraints);
    const geometries = layerResults.flatMap((result) => result.geometries);

    if (constraints.length === 0) {
      return buildFixtureSpatialLayerResult(input, retrievedAt);
    }

    return {
      constraints,
      geometries,
      source: "arcgis",
      loadedAt: retrievedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function buildFixtureSpatialLayerResult(
  input: { address: string; council: string },
  loadedAt = new Date().toISOString(),
): SpatialLayerResult {
  return {
    constraints: buildFixtureSpatialConstraints({ address: input.address, council: input.council }),
    geometries: buildFixtureGeometries(),
    source: "fixture",
    loadedAt,
  };
}

function buildFixtureGeometries(): SpatialLayerGeometry[] {
  return [
    {
      id: "fixture-site-envelope",
      constraintId: "fixture-zoning",
      category: SpatialConstraintCategory.ZONING,
      geometry: {
        type: "Polygon",
        coordinates: [[
          [151.20665, -33.8707],
          [151.20755, -33.87085],
          [151.20735, -33.87155],
          [151.20645, -33.87135],
          [151.20665, -33.8707],
        ]],
      },
    },
    {
      id: "fixture-risk-corridor",
      constraintId: "fixture-flood",
      category: SpatialConstraintCategory.FLOOD,
      geometry: {
        type: "Polygon",
        coordinates: [[
          [151.20685, -33.8712],
          [151.20765, -33.87135],
          [151.20755, -33.87175],
          [151.20675, -33.87155],
          [151.20685, -33.8712],
        ]],
      },
    },
  ];
}
