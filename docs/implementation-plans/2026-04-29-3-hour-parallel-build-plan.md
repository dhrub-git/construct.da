# 3-hour parallel build plan — live map, PDF red-lines, streaming extraction, cl. 4.6 drafter

Date: 2026-04-29
Base commit: `20c3e2e` (`Stabilize spatial constraints before live map work`)
Timebox: 3 hours
Mode: parallel worktrees with one integration captain

## Goal

Ship a judge-facing demo path:

1. project address opens a live/fixture-backed spatial map;
2. uploaded drawing shows red-line issue boxes;
3. issue boxes and a right rail animate/stream into view;
4. a deterministic cl. 4.6 draft artifact is generated and downloadable;
5. final demo is resilient even if live ArcGIS or model calls fail.

## Non-negotiable principles

- Keep every feature demo-safe with deterministic fixture fallback.
- Avoid DB migrations; store demo/evidence data in metadata or typed fixtures first.
- Keep live external calls behind server utilities/routes with short timeouts and cached normalized output.
- Do not commit `.env`; document variable names only.
- Optimize for one polished vertical demo over complete generality.


## Ref MCP documentation checks applied

The risky integration details were cross-checked before execution planning:

- `@vis.gl/react-google-maps` docs confirm `APIProvider` wraps all map components, `Map` renders the base map, `AdvancedMarker` marks the site, and `Polygon` accepts `paths`, `fillColor`, `fillOpacity`, `strokeColor`, and `strokeWeight`.
- Esri ArcGIS REST docs confirm point spatial queries require `geometry`, `geometryType=esriGeometryPoint`, `spatialRel` such as `esriSpatialRelIntersects`, and `inSR=4326` for WGS84 input points.
- AI SDK docs confirm `streamObject` can stream schema-shaped objects, and in `output: "array"` mode `elementStream` yields complete array elements. `experimental_useObject` is available but experimental and expects an API that streams JSON matching a schema.
- React-PDF docs/search results confirm the package must be the PDF.js viewer package (`react-pdf` by wojtekmaj, not `@react-pdf/renderer`/diegomura). In Next App Router, put `'use client'` at the top of the viewer module and configure `pdfjs.GlobalWorkerOptions.workerSrc` in that same module before rendering `Document`/`Page`.

## Environment / dependency plan

### New dependencies to add once, in a foundation branch

Current dependency status checked from `package.json`:

- missing: `@vis.gl/react-google-maps`
- missing: `react-pdf`
- missing: `pdfjs-dist`
- missing: `framer-motion`
- missing: `zod`
- present: `ai@^6.0.168`

Foundation command:

```bash
npm install @vis.gl/react-google-maps react-pdf pdfjs-dist framer-motion zod
```

### `.env` additions

Existing `.env` already contains server-side `GOOGLE_MAPS_API_KEY`. For browser-rendered Google Maps, add a client-safe browser-restricted key:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

Recommended: use a separately restricted Google Maps JavaScript API key rather than exposing the unrestricted server geocoding key.

No env var is expected for public NSW ArcGIS REST layers. Keep ArcGIS requests server-side where possible.

Optional existing key:

```bash
INGESTION_ADMIN_TOKEN=...
```

Only needed for ingestion/admin service-token endpoints, not for the demo map/PDF/drafter path.

## Worktree setup

Start from a clean base commit and keep unrelated local changes out of the worktrees.

```bash
# from /Users/dhrubbiswas/code/codex-hackathon/construct.da
git worktree add ../construct.da-foundation -b build/foundation 20c3e2e
git worktree add ../construct.da-map -b feature/live-map 20c3e2e
git worktree add ../construct.da-pdf -b feature/pdf-redlines 20c3e2e
git worktree add ../construct.da-drafter -b feature/clause46-drafter 20c3e2e
git worktree add ../construct.da-stream -b feature/streaming-extraction 20c3e2e
```

Recommended integration order:

1. `build/foundation`
2. `feature/live-map`
3. `feature/pdf-redlines`
4. `feature/clause46-drafter`
5. `feature/streaming-extraction`
6. demo polish on `main` or `feature/demo-polish`

Each lane should commit independently with Lore-format commit messages. Integration captain merges/rebases lanes and owns conflict resolution.

## Shared interface contracts

### Spatial map contract

Use existing `SpatialConstraint` from `src/lib/spatial`.

Add only if needed:

```ts
type SpatialConstraintGeometry = {
  type: "Point" | "Polygon" | "MultiPolygon";
  coordinates: unknown;
};

type SpatialLayerResult = {
  constraints: SpatialConstraint[];
  geometries: Array<{
    id: string;
    constraintId: string;
    category: SpatialConstraint["category"];
    geometry: SpatialConstraintGeometry;
  }>;
  source: "arcgis" | "fixture";
  loadedAt: string;
};
```

If time is tight, render marker + constraint chips first, then add polygons.

### Violation box contract

Create in a shared module, preferably `src/lib/pdf/violation-schema.ts`:

```ts
export type ViolationSeverity = "info" | "warning" | "error";

export type PdfViolationBox = {
  id: string;
  fileId: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  coordinateSpace: "pdf-user-space";
  severity: ViolationSeverity;
  rule: string;
  title: string;
  message: string;
};
```

Use deterministic fixture boxes for the uploaded plan until extraction is reliable.

### cl. 4.6 drafter contract

Create in `src/lib/drafter/clause46.ts`:

```ts
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
```

## Lane 0 — Foundation branch (10-20 minutes)

Owner: integration captain or fastest setup agent

Files likely touched:

- `package.json`
- `package-lock.json`
- optionally `docs/adr/0002-demo-feature-stack.md`
- optionally `.env.example` if the team wants tracked env names

Tasks:

1. Install shared dependencies.
2. Add `.env.example` with names only if desired:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `BLOB_READ_WRITE_TOKEN`
   - `GOOGLE_MAPS_API_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `GEOSCAPE_API_KEY`
   - `MISTRAL_AI_KEY`
   - `GOOGLE_GENERATIVE_AI_API_KEY`
   - `INGESTION_ADMIN_TOKEN` optional
3. Run `npm run typecheck` after install.
4. Commit foundation branch.
5. Rebase/merge each feature branch onto foundation before heavy implementation.

Acceptance:

- Dependencies install cleanly.
- `npm run typecheck` passes.
- No `.env` committed.

## Lane 1 — Upgrade Feature 1 to live map (60-90 minutes)

Owner branch: `feature/live-map`

Primary files:

- `src/lib/spatial/arcgis.ts` — ArcGIS query URL builder, fetch with timeout, normalize features.
- `src/lib/spatial/fixtures.ts` or existing `constraints.ts` — fallback geometry/constraint fixtures if live call fails.
- `src/app/api/projects/[projectId]/spatial/route.ts` or `src/app/api/spatial/constraints/route.ts` — server route returning normalized live/fallback data.
- `src/components/projects/project-constraint-map.tsx` — client map component using `@vis.gl/react-google-maps` (`APIProvider`, `Map`, `AdvancedMarker`, `Polygon`).
- `src/components/projects/project-overview-tab.tsx` — embed map/panel without breaking current fixture panel.
- `test/spatial-arcgis.test.ts` — URL construction and normalization tests.

Implementation steps:

1. Implement ArcGIS REST URL builder for centroid point queries.
   - Query public NSW planning layers using `geometry={x: lng, y: lat, spatialReference:{wkid:4326}}`.
   - Include `geometryType=esriGeometryPoint`; ArcGIS requires this whenever `geometry` is supplied.
   - Use `f=geojson`, `returnGeometry=true`, `inSR=4326`, `outSR=4326`, `spatialRel=esriSpatialRelIntersects`.
2. Add short timeout and catch/fallback path.
   - If ArcGIS fails, return deterministic fixture constraints/geometries with source `fixture`.
3. Add API route that accepts project ID or lat/lng.
   - Prefer project ID to reuse stored project `metadata.geoEncoding` and future cache writes.
4. Build map component.
   - Use `APIProvider` with `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
   - Center on project centroid.
   - Render subject marker with `AdvancedMarker`.
   - Render polygons with `Polygon paths={...}` when geometry exists; otherwise keep the marker + chips.
   - Add legend chips and staggered reveal with `framer-motion`.
5. Wire into overview.
   - Do not remove current fixture constraint panel; upgrade it to include the map above/beside chips.

Acceptance:

- With valid key and network, map centers on project centroid and displays at least marker + live/fallback overlays.
- With ArcGIS unavailable, UI still shows fixture constraints and an advisory fixture badge.
- `npm test -- spatial` or targeted tests pass.
- `npm run typecheck` passes.

Risks / cuts:

- If polygon rendering takes too long, cut to marker + animated layer chips; preserve live normalized constraints.
- If Google Maps key is missing, render a graceful static fallback panel rather than crashing.

## Lane 2 — PDF red-line overlay (70-100 minutes)

Owner branch: `feature/pdf-redlines`

Primary files:

- `src/lib/pdf/violation-schema.ts` — box schema/types and fixture boxes.
- `src/lib/pdf/coordinates.ts` — PDF user-space to CSS coordinate conversion.
- `src/components/projects/pdf-redline-viewer.tsx` — `react-pdf` viewer with overlay boxes. Must be a client component and must configure `pdfjs.GlobalWorkerOptions.workerSrc` before rendering.
- `src/components/projects/project-evidence-tab.tsx` or `project-report-tab.tsx` integration.
- `test/pdf-coordinates.test.ts`

Implementation steps:

1. Define `PdfViolationBox` and deterministic height/setback fixtures.
2. Implement coordinate conversion:
   - CSS left = `x * scale`
   - CSS top = `(pageHeight - y - h) * scale`
   - width/height multiply by scale.
3. Add dynamic client-only PDF component.
   - Use the `react-pdf` viewer package (`Document`, `Page`, `pdfjs`), not the similarly named PDF generation package.
   - Add `'use client'` at the top of the viewer module.
   - Configure `pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()` in the same module before rendering `Document`/`Page`.
   - If Next/Turbopack hits a `canvas` resolution error, add the documented `canvas` alias fallback in `next.config.ts`. Do this only if the error appears.
   - Render first uploaded PDF by URL.
4. Overlay fixture boxes for a selected page.
   - Red for violation, amber for warning, green/blue for info.
   - Tooltip/caption includes rule and message.
5. Add a lightweight evidence tab or place under report tab.
   - If modifying tabs risks conflicts, export component and leave final placement to integration captain.

Acceptance:

- A project file URL can render in the viewer.
- Fixture red boxes appear at expected positions.
- Coordinate conversion tests cover y-axis flip.
- Viewer fails gracefully when no PDF exists.

Risks / cuts:

- If private Vercel blob URLs block browser PDF loading, use existing uploaded URL path if public or a fixture PDF under `public/` for demo.
- If `react-pdf` worker config is noisy, keep component isolated and verify in browser early.

## Lane 3 — cl. 4.6 drafter (60-90 minutes)

Owner branch: `feature/clause46-drafter`

Primary files:

- `src/lib/drafter/clause46.ts`
- `src/components/projects/clause46-draft-panel.tsx`
- `src/components/projects/project-report-tab.tsx` or standalone component for integration.
- `test/clause46-drafter.test.ts`

Implementation steps:

1. Build deterministic pure drafter function.
   - Inputs: council, address, standard, limit, proposed, variation percent, objectives, planning grounds.
   - Output: sections + markdown.
2. Enforce case-law order in generated sections:
   - Identify development standard.
   - Quantify contravention.
   - cl. 4.6(3)(a): unreasonable/unnecessary.
   - Wehbe Way 1: objectives achieved notwithstanding non-compliance.
   - cl. 4.6(3)(b): sufficient environmental planning grounds.
   - Initial Action / Four2Five specificity note.
   - Public interest / zone objectives placeholder.
   - Advisory disclaimer.
3. Add `variationPercent > 10` LPP flag.
4. Add component showing draft and copy/download markdown button.
   - Download can be a client-created `.md` file; Word/PDF export can wait.
5. Use deterministic demo input from height fixture/violation if no live extracted breach exists.

Acceptance:

- Unit tests verify section ordering and `>10%` LPP flag.
- Component renders deterministic draft from fixture data.
- Download/copy works without server dependency.

Risks / cuts:

- Do not attempt live legislation retrieval in this 3-hour window.
- Label objectives as fixture/placeholders unless sourced.

## Lane 4 — Streaming extraction visualization (45-75 minutes, starts after PDF schema exists)

Owner branch: `feature/streaming-extraction`

Primary files:

- `src/lib/extraction/violation-stream.ts` or `src/lib/pdf/violation-fixtures.ts`
- `src/components/projects/streaming-issue-overlay.tsx`
- `src/components/projects/issue-right-rail.tsx`
- optionally `src/app/api/projects/[projectId]/violations/stream/route.ts`

Implementation steps:

1. Prefer deterministic client-side timed streaming first.
   - Simulate issue boxes arriving every 400-700ms from fixture list.
   - This guarantees demo polish independent of model/API reliability.
2. If true AI streaming is attempted, use AI SDK `streamObject` with `output: "array"` and consume `elementStream` for complete issue boxes, or use `experimental_useObject` only behind a fallback because it is explicitly experimental.
3. Add scan-line animation using `framer-motion`.
   - Move line to next box top before revealing box.
4. Add right-rail issue list synchronized with revealed boxes.
5. If time remains, add server route that streams model/extractor results using existing AI SDK; keep fixture fallback default.
6. Integrate with PDF overlay component by passing `visibleBoxes` state.

Acceptance:

- Clicking/starting extraction animates boxes into PDF overlay and list.
- Right rail count/status updates live.
- Works entirely offline with fixture boxes.

Risks / cuts:

- Do not block on true AI streaming. The visual effect is the demo value; real extraction can be Phase 2.
- Avoid editing the same PDF viewer internals as Lane 2; expose a wrapper component if possible.

## Lane 5 — Demo polish and integration (final 35-45 minutes)

Owner: integration captain

Primary files likely touched:

- `src/components/projects/project-details-page-client.tsx`
- `src/components/projects/project-overview-tab.tsx`
- `src/components/projects/project-report-tab.tsx`
- `src/components/projects/project-header-card.tsx`
- `docs/adr/*` if decisions shift

Tasks:

1. Merge/rebase lanes in recommended order.
2. Resolve conflicts, especially:
   - `package.json` / `package-lock.json`
   - project details tabs
   - overview/report tab integration points
3. Add a clean demo route through the UI:
   - Overview: live/fixture map and constraint register.
   - Evidence/report: PDF red-lines + streaming right rail.
   - Draft: cl. 4.6 panel/download.
4. Add graceful missing-data states:
   - no map key
   - no uploaded PDF
   - live ArcGIS failure
   - no generated report
5. Run full verification.
6. Capture screenshots or a 90-second rehearsal checklist.

Acceptance:

- Demo can be performed from one existing project without terminal intervention.
- Missing external services degrade to fixtures, not crashes.
- `npm test`, `npm run typecheck`, `npm run lint` pass.
- Browser smoke test on localhost passes for the happy path.

## Parallel merge protocol

Each lane finishes with:

```bash
npm run typecheck
npm test -- <lane-specific tests if available>
npm run lint

git status --short
git diff --stat
git commit -F /tmp/lore-message.txt
```

Integration captain then:

```bash
git checkout main
git merge build/foundation
git merge feature/live-map
git merge feature/pdf-redlines
git merge feature/clause46-drafter
git merge feature/streaming-extraction
npm install
npm test
npm run typecheck
npm run lint
npm run dev
```

Browser smoke checklist:

- open dashboard/project
- verify overview map/constraint panel renders
- verify PDF red-line viewer renders or shows a useful fallback
- start streaming reveal; confirm boxes/list animate
- generate/download cl. 4.6 draft

## Timeboxed schedule

| Time | Integration captain | Map lane | PDF lane | Drafter lane | Streaming lane |
|---|---|---|---|---|---|
| 0:00-0:15 | foundation deps/env docs | rebase on foundation | rebase on foundation | rebase on foundation | wait for PDF schema or build fixture wrapper |
| 0:15-1:00 | monitor conflicts | ArcGIS utility + route | schema + coordinate tests | pure drafter + tests | streaming fixture plan |
| 1:00-1:45 | first merge candidate review | map UI + fallback | PDF viewer + boxes | draft panel/download | animation + right rail |
| 1:45-2:20 | merge map/PDF/drafter | fix review issues | fix viewer issues | fix UI integration | integrate with PDF overlay |
| 2:20-2:45 | merge streaming + polish | support integration | support integration | support integration | support integration |
| 2:45-3:00 | full verification + demo rehearsal | standby | standby | standby | standby |

## Cut lines if behind schedule

1. Cut live polygons before cutting map presence. Marker + animated constraint chips is acceptable.
2. Cut true AI streaming before cutting streaming visualization. Fixture streaming is acceptable.
3. Cut Word/PDF export before cutting markdown download/copy.
4. Cut broad council support before cutting one deterministic NSW demo project.
5. Never cut graceful fallbacks; crashes lose the demo.

## Final verification gate

Required before calling the 3-hour build complete:

```bash
npm test
npm run typecheck
npm run lint
```

Plus browser smoke test:

```bash
npm run dev
# open localhost project page and run the scripted demo path
```

## ADR follow-up

After implementation, update `docs/adr/0001-fixture-first-spatial-constraints.md` or add ADR 0002 with:

- live ArcGIS vs fixture source authority decision, including whether per-layer ArcGIS results make the panel source `arcgis` or `mixed`;
- whether top-level source supports `mixed`;
- whether true AI extraction shipped or fixture streaming remained the demo path;
- export format chosen for cl. 4.6 artifact.
