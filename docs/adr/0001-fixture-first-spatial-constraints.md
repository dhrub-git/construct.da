# ADR 0001 — Fixture-first spatial constraints for Phase 1

Date: 2026-04-29
Status: Accepted for Phase 1; source-mixing contract remains a Phase 1.5/2 watch item

## Context

The hackathon demo sequence starts with a spatial constraint moment before PDF red-lines and a cl. 4.6 drafter. The original ambition was a live NSW constraint map backed by ArcGIS/Spatial Viewer layers, but Phase 1 needed a reliable first slice that would not fail because of external API latency, schema drift, CORS, credentials, or network conditions.

The existing app already stores project metadata as JSON and includes `geoEncoding`, so the first implementation can stabilize the spatial data contract without a database migration or map-rendering dependency.

## Decision

Implement Phase 1 as a fixture-first spatial constraint panel in the project overview.

The app records spatial constraints in project metadata using a normalized `SpatialConstraint[]` contract. New projects receive deterministic fixture constraints at creation time. The workspace derivation layer normalizes metadata before exposing UI state, and the overview renders zoning, height, heritage, flood, and bushfire-style advisory signals.

Do not add Google Maps, ArcGIS querying, polygon rendering, or map-specific dependencies in Phase 1.

## Implementation recorded

- Added `src/lib/spatial` with:
  - `SpatialConstraint`
  - category, severity, status, source, and confidence types
  - deterministic fixture generation
  - normalization helpers for raw metadata JSON
  - merge helpers for later manual/live updates
- Extended `ProjectMetadata` with:
  - `spatialConstraints?: SpatialConstraint[]`
  - `spatialConstraintsLoadedAt?: string`
  - `spatialConstraintsSource?: "fixture" | "arcgis" | "manual"`
- Updated `deriveProjectWorkspaceState` to expose:
  - `spatialConstraints`
  - `hasSpatialConstraints`
  - `spatialConstraintSource`
  - `spatialConstraintsLoadedAt`
- Added a project overview spatial panel with:
  - zoning and height summary cards
  - heritage/flood/bushfire risk chips
  - source and confidence labels
  - fixture advisory badge

## Code review decisions incorporated

- Partial spatial metadata patches must preserve existing fields. `mergeSpatialConstraints` now uses the previous constraint as fallback when IDs match, so a patch like `{ id, value }` does not erase category, label, severity, status, source, or evidence.
- Top-level `spatialConstraintsSource` is runtime-normalized because project metadata is untyped JSON at rest.
- New spatial UI text uses semantic Tailwind tokens (`text-foreground`, `text-muted-foreground`) instead of hardcoded palette classes.

## Consequences

Positive:
- Phase 1 has a deterministic demo path and stable data contract.
- No database migration or new map dependency is required.
- Later ArcGIS/manual/PDF evidence work can reuse the same constraint shape.

Trade-offs:
- Existing projects created before this slice will not show spatial constraints until backfilled or refreshed.
- Fixture data is advisory only and must not be presented as live government data.
- `createProject` now seeds fixture constraints; future live enrichment should move into a separate refresh/update boundary rather than expanding project creation into an enrichment orchestrator.

## Watch item for Phase 1.5/2

The contract currently stores both per-constraint source metadata and a top-level `spatialConstraintsSource`. This is acceptable while Phase 1 data is homogeneous fixture data. Before combining fixture, ArcGIS, and manual overrides, define explicit mixed-source behavior, such as:

1. derive panel-level source only from per-constraint sources;
2. rename the top-level field to `primarySpatialConstraintSource` / `spatialConstraintMode`; or
3. add an explicit `mixed` panel source state.

## Verification

- `npm test` passed with spatial normalization, invalid-source fallback, partial-patch merge, and workspace exposure coverage.
- `npm run typecheck` passed.
- `npm run lint` passed.
