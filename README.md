# construct.da

Advisory-first DA approval screening for Australian residential projects.

This repository contains a Next.js App Router MVP for pre-lodgement review. The product helps users capture project context, upload supporting files, run an automated processing workflow, and view an evidence-backed compliance-style report before formal council or certifier review.


## Codex Hackathon provenance

This repository is named **construct.da**. It was copied from [`dhrub-git/da-approval`](https://github.com/dhrub-git/da-approval/) on April 29, 2026 as a fresh Codex Hackathon worktree so new hackathon work can be tracked separately from the original source.

## Current product slice

The app already includes these working slices in the codebase:

- **Marketing landing page** with advisory-first positioning for NSW, Victoria, and Queensland
- **Guided intake shell** with multi-step local-state navigation
- **Authenticated dashboard** for creating and browsing projects
- **Project workspace** with overview, report, and file tabs
- **File upload + processing workflow** backed by Vercel Workflow, Vercel Blob, OCR, chunking, and report generation
- **Address search endpoint** using Google Places plus Geoscape council lookup
- **Settings and notifications screens** as supporting product surfaces
- **Unit/component tests** covering the landing page, intake flow, utility helpers, and project workspace helpers

## Stack

- **Framework:** Next.js 16 App Router
- **Language:** TypeScript
- **UI:** Tailwind CSS v4 + shadcn/ui
- **State:** Redux Toolkit
- **Auth:** Clerk
- **Database:** PostgreSQL + Prisma
- **Storage:** Vercel Blob
- **Async workflows:** Vercel Workflow
- **Document OCR:** Mistral OCR
- **Address/council enrichment:** Google Maps + Geoscape
- **Testing:** Vitest + React Testing Library

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

The following variables are referenced directly in the app code:

```bash
DATABASE_URL=
CLERK_SECRET_KEY=
GOOGLE_MAPS_API_KEY=
GEOSCAPE_API_KEY=
MISTRAL_AI_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
EMBEDDING_DB_CHUNK_SIZE=
```

Notes:

- `DATABASE_URL` is required at startup by `src/lib/prisma.ts`.
- `GOOGLE_MAPS_API_KEY` and `GEOSCAPE_API_KEY` are required for `/api/address/search`.
- `MISTRAL_AI_KEY` is required for OCR in `src/lib/ocr.ts`.
- `NEXT_PUBLIC_APP_URL` is used by workflow code when building callback URLs; the code falls back to `http://localhost:3000` if omitted.
- Clerk routes and components are present in the app, so you will also need the normal Clerk frontend/webhook configuration for a fully working local auth flow.

### 3. Start the development server

```bash
npm run dev
```

Open http://localhost:3000.

## Available scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:watch
npm run typecheck
npm run run-ingestion
```

## Key routes

- `/` — landing page
- `/intake` — guided intake shell
- `/dashboard` — authenticated projects dashboard
- `/dashboard/[projectId]` — project workspace
- `/notifications` — notifications surface
- `/settings` — settings surface
- `/sign-in` and `/sign-up` — Clerk auth pages

## Repository structure

```text
src/
  app/                Next.js routes, layouts, and API handlers
  components/         UI, marketing, intake, dashboard, and project components
  context/            workflow stream context
  lib/                domain logic, actions, agents, workflows, helpers
  prisma/             Prisma schema
  redux/              client state slices and store
  types/              shared TypeScript models

data/                 static seed-like UI content
scripts/              ingestion and helper scripts
test/                 Vitest + React Testing Library coverage
docs/                 planning and implementation notes
```

## Symphony automation

This repository now includes a repo-local Symphony workflow at `WORKFLOW.md` plus optional repo-local Codex skills under `.codex/skills/`.

See `docs/symphony-setup.md` for the full setup flow, including:

- required Linear workflow states
- the `LINEAR_API_KEY` requirement
- the `tracker.project_slug` value you still need to set manually
- commands for running the upstream Symphony Elixir service against this repo

## Testing and verification

Run the main verification commands as you work:

```bash
npm run test
npm run lint
npm run typecheck
```

Current tests cover:

- landing page rendering
- intake step navigation
- markdown/list utility helpers
- derived project workspace/report helpers

## Product posture

This MVP is intentionally **advisory only**. It is designed to surface likely gaps, missing documents, and risk signals before formal lodgement. Final requirements still depend on the relevant council, certifier, and official planning controls.
