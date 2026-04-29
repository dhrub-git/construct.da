"use client";

import { useEffect, useMemo, useState } from "react";
import { APIProvider, AdvancedMarker, Map, Polygon } from "@vis.gl/react-google-maps";
import { MapPinnedIcon, RadarIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  SpatialConstraintCategory,
  SpatialConstraintSource,
  type SpatialConstraint,
  type SpatialLayerGeometry,
  type SpatialLayerResult,
} from "@/lib/spatial";

type LatLngLiteral = { lat: number; lng: number };

type ProjectConstraintMapProps = {
  projectId: string;
  address: string;
  location: LatLngLiteral | null;
  initialConstraints: SpatialConstraint[];
  initialSource: SpatialConstraintSource | null;
};

type LoadState = "idle" | "loading" | "ready" | "fallback";

const CATEGORY_STYLES: Record<SpatialConstraint["category"], { stroke: string; fill: string; label: string }> = {
  [SpatialConstraintCategory.ZONING]: { stroke: "#2563eb", fill: "rgba(37, 99, 235, 0.22)", label: "Zoning" },
  [SpatialConstraintCategory.HEIGHT]: { stroke: "#7c3aed", fill: "rgba(124, 58, 237, 0.18)", label: "Height" },
  [SpatialConstraintCategory.HERITAGE]: { stroke: "#b45309", fill: "rgba(180, 83, 9, 0.2)", label: "Heritage" },
  [SpatialConstraintCategory.FLOOD]: { stroke: "#0891b2", fill: "rgba(8, 145, 178, 0.2)", label: "Flood" },
  [SpatialConstraintCategory.BUSHFIRE]: { stroke: "#dc2626", fill: "rgba(220, 38, 38, 0.18)", label: "Bushfire" },
  [SpatialConstraintCategory.PLANNING_CONTROL]: { stroke: "#475569", fill: "rgba(71, 85, 105, 0.18)", label: "Planning" },
};

function isPolygonRing(value: unknown): value is number[][] {
  return Array.isArray(value) && value.every((point) => (
    Array.isArray(point)
    && point.length >= 2
    && typeof point[0] === "number"
    && typeof point[1] === "number"
  ));
}

function flattenPolygonRings(geometry: SpatialLayerGeometry["geometry"]): number[][][] {
  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates.filter(isPolygonRing);
  }

  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates.flatMap((polygon) => Array.isArray(polygon) ? polygon.filter(isPolygonRing) : []);
  }

  return [];
}

function ringToLatLngPath(ring: number[][]): LatLngLiteral[] {
  return ring.map(([lng, lat]) => ({ lat, lng }));
}

function buildProjection(geometries: SpatialLayerGeometry[], location: LatLngLiteral | null) {
  const coordinates = geometries.flatMap((item) => flattenPolygonRings(item.geometry)).flat();
  if (location) {
    coordinates.push([location.lng, location.lat]);
  }

  if (coordinates.length === 0) {
    return null;
  }

  const lngs = coordinates.map((point) => point[0]);
  const lats = coordinates.map((point) => point[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const lngSpan = maxLng - minLng || 0.001;
  const latSpan = maxLat - minLat || 0.001;
  const padding = 18;
  const width = 100;
  const height = 100;

  return (point: number[]) => {
    const x = padding + ((point[0] - minLng) / lngSpan) * (width - padding * 2);
    const y = height - padding - ((point[1] - minLat) / latSpan) * (height - padding * 2);
    return [x, y] as const;
  };
}

function polygonPath(ring: number[][], project: (point: number[]) => readonly [number, number]): string {
  return ring
    .map((point, index) => {
      const [x, y] = project(point);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ") + " Z";
}

function StaticFallbackMap({
  geometries,
  location,
  source,
}: {
  geometries: SpatialLayerGeometry[];
  location: LatLngLiteral | null;
  source: SpatialLayerResult["source"] | SpatialConstraintSource;
}) {
  const project = useMemo(() => buildProjection(geometries, location), [geometries, location]);
  const marker = location && project ? project([location.lng, location.lat]) : null;

  return (
    <div className="relative min-h-[320px] bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.16),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.06),rgba(148,163,184,0.16))]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" role="img" aria-label="Planning overlay map preview">
        {project ? geometries.map((geometry) => (
          <g key={geometry.id}>
            {flattenPolygonRings(geometry.geometry).map((ring, index) => {
              const style = CATEGORY_STYLES[geometry.category];
              return (
                <path
                  key={`${geometry.id}-${index}`}
                  d={polygonPath(ring, project)}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth="0.8"
                  strokeDasharray={geometry.category === SpatialConstraintCategory.FLOOD ? "2 1.5" : undefined}
                />
              );
            })}
          </g>
        )) : null}
        {marker ? (
          <g transform={`translate(${marker[0]} ${marker[1]})`}>
            <circle r="4.8" fill="rgba(37,99,235,0.18)" />
            <circle r="2.2" fill="#2563eb" stroke="white" strokeWidth="0.8" />
          </g>
        ) : null}
      </svg>
      <MapCaption location={location} source={source} />
    </div>
  );
}

function GoogleConstraintMap({
  geometries,
  location,
  source,
}: {
  geometries: SpatialLayerGeometry[];
  location: LatLngLiteral;
  source: SpatialLayerResult["source"] | SpatialConstraintSource;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <StaticFallbackMap geometries={geometries} location={location} source={source} />;
  }

  return (
    <div className="relative min-h-[320px]">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={location}
          defaultZoom={17}
          gestureHandling="greedy"
          disableDefaultUI
          className="absolute inset-0 size-full"
        >
          <AdvancedMarker position={location} title="Project site" />
          {geometries.flatMap((geometry) => flattenPolygonRings(geometry.geometry).map((ring, index) => {
            const style = CATEGORY_STYLES[geometry.category];
            return (
              <Polygon
                key={`${geometry.id}-${index}`}
                paths={ringToLatLngPath(ring)}
                fillColor={style.stroke}
                fillOpacity={0.18}
                strokeColor={style.stroke}
                strokeOpacity={0.9}
                strokeWeight={2}
              />
            );
          }))}
        </Map>
      </APIProvider>
      <MapCaption location={location} source={source} />
    </div>
  );
}

function isArcGisSource(source: SpatialLayerResult["source"] | SpatialConstraintSource): boolean {
  return String(source) === SpatialConstraintSource.ARCGIS;
}

function MapCaption({ location, source }: { location: LatLngLiteral | null; source: SpatialLayerResult["source"] | SpatialConstraintSource }) {
  return (
    <div className="absolute bottom-4 left-4 right-4 rounded-[16px] border border-white/60 bg-background/90 p-3 shadow-sm backdrop-blur">
      <div className="flex items-start gap-3">
        <RadarIcon className="mt-0.5 size-4 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">
            {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "No project centroid available"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isArcGisSource(source) ? "Server-side ArcGIS overlays normalized for the site." : "Demo-safe deterministic overlays are shown while live layers are unavailable."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProjectConstraintMap({
  projectId,
  address,
  location,
  initialConstraints,
  initialSource,
}: ProjectConstraintMapProps) {
  const [result, setResult] = useState<SpatialLayerResult | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/projects/${projectId}/spatial`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load live spatial layers");
        }

        return await response.json() as SpatialLayerResult;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setResult(payload);
        setState(payload.source === "fixture" ? "fallback" : "ready");
      })
      .catch(() => {
        if (!cancelled) {
          setState("fallback");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const constraints = result?.constraints.length ? result.constraints : initialConstraints;
  const geometries = result?.geometries ?? [];
  const source = result?.source ?? initialSource ?? SpatialConstraintSource.FIXTURE;

  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-background shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
            <MapPinnedIcon className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Live spatial map</p>
            <p className="text-sm text-muted-foreground">{address}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isArcGisSource(source) ? "default" : "outline"}>
            {isArcGisSource(source) ? "ArcGIS live" : "Fixture fallback"}
          </Badge>
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? <Badge variant="secondary">Google Maps</Badge> : <Badge variant="secondary">Static preview</Badge>}
          {state === "loading" ? <Badge variant="secondary">Loading layers</Badge> : null}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        {location ? (
          <GoogleConstraintMap geometries={geometries} location={location} source={source} />
        ) : (
          <StaticFallbackMap geometries={geometries} location={location} source={source} />
        )}

        <div className="flex flex-col gap-3 border-t border-border p-4 lg:border-l lg:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Layer legend</p>
          {constraints.slice(0, 6).map((constraint, index) => {
            const style = CATEGORY_STYLES[constraint.category];
            return (
              <div
                key={constraint.id}
                className="rounded-[14px] border border-border bg-secondary/40 p-3 opacity-100 transition-all duration-500"
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: style.stroke }} />
                    <p className="text-sm font-medium text-foreground">{style.label}</p>
                  </div>
                  <Badge variant="secondary">{constraint.status.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{constraint.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
