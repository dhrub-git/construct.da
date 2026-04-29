# Bootstrap review and first vertical-slice handoff

## Purpose
This document closes the current documentation gap between the existing planning artifacts and the first production-facing implementation task: a **verified landing page + intake shell** built with **Next.js App Router**, **shadcn/ui**, and **Tailwind CSS v4**.

It is intentionally scoped to the repo state on **April 22, 2026** in this worker branch, where the workspace contains planning docs and a static mockup prototype, but **no application scaffold yet**.

## Review basis
This review uses the following repo artifacts as source inputs:
- `.omx/plans/prd-da-approval-advisory-checker.md`
- `.omx/plans/test-spec-da-approval-advisory-checker.md`
- `.omx/context/da-approval-mvp-implementation-20260421T154352Z.md`
- `docs/implementation-plans/2026-04-22-da-approval-mvp/implementation_breakdown.md`
- `mockups/approval-concept/index.html`
- `mockups/approval-concept/styles.css`
- `mockups/approval-concept/script.js`

## Current-state review

### What is already strong
1. **Product framing is clear.** The PRD, test spec, and implementation breakdown agree on the advisory-only posture, the initial jurisdictions, and the Vercel-first architecture.
2. **The mockup is a strong visual reference.** The current prototype already captures the intended information hierarchy for:
   - the trust-first landing page,
   - the guided intake stepper,
   - the advisory positioning and disclaimer language.
3. **The mockup already contains reusable UX signals.** The current hero, trust strip, intake helper copy, and CTA structure are production-appropriate foundations for the first slice.
4. **Some accessibility intent is already present.** The mockup includes a skip link, visible focus states, minimum target sizing, and `aria-live` step feedback.

### Gaps that must be fixed during the production bootstrap
1. **There is no production app scaffold yet.** The repo still needs the actual Next.js App Router foundation, test harness, and UI component boundaries.
2. **The mockup behavior is DOM-script driven.** `mockups/approval-concept/script.js` is useful as a prototype reference, but the production slice should replace direct DOM mutation with typed React state and component props.
3. **Some styles are embedded inline.** The HTML currently includes inline pill spacing/sizing styles, which should be removed during the App Router build and replaced with reusable component styling.
4. **Interactive semantics need tightening.** The prototype uses clickable cards with radio-like behavior, but the production intake shell should use accessible form primitives and predictable keyboard handling.
5. **No testable contract exists yet for the first slice.** The planning docs describe the product direction, but they do not yet pin down what the first verified landing + intake milestone must prove.

## Production carry-forward guidance

### Keep from the mockup
Carry these decisions forward into the first App Router slice:
- the hero headline and advisory-first positioning
- NSW / Victoria / Queensland coverage messaging
- the calm, trust-first tone rather than generic SaaS language
- a guided multi-step intake shell rather than a dense single form
- prominent advisory disclaimer language before users begin analysis

### Do not carry forward literally
Do **not** copy these prototype implementation details into production:
- direct `querySelector`-driven state changes
- inline style attributes in JSX/HTML
- free-form button groups where a real fieldset/radio-group is expected
- one large page-level file that owns every screen state

### Recommended component translation
Use the mockup as a design map, then translate it into production boundaries roughly like this:
- `app/page.tsx` — landing route
- `app/intake/page.tsx` — intake shell route
- `components/marketing/*` — hero, trust strip, how-it-works, CTA sections
- `components/intake/*` — stepper shell, step panels, disclaimer panel, footer actions
- `lib/content/landing.ts` — stable marketing copy/constants
- `lib/intake/steps.ts` — step metadata and labels

## First verified vertical slice

### Slice goal
Deliver a small but credible production baseline that proves:
1. the repo can run a real Next.js App Router app,
2. the visual direction can move from static mockup to production components,
3. the landing page can route into a guided intake shell,
4. the slice is test-backed and safe for further iteration.

### In scope
The first vertical slice should include:
- a polished landing page route at `/`
- an intake shell route at `/intake`
- shared header / branding / shell treatment
- primary CTA from landing to intake
- a visible advisory disclaimer
- a non-persistent, local-state-only stepper shell with representative fields
- shadcn/ui-backed primitives where they improve consistency
- Tailwind v4 styling aligned to the mockup tone
- automated tests for the slice's core navigation and rendered states

### Explicitly out of scope for this slice
Do **not** expand the first slice to include:
- authentication
- database persistence
- file upload infrastructure
- address resolution services
- OCR/classification
- rules evaluation
- generated advisory reports
- reviewer workflows

Those belong to later epics in `implementation_breakdown.md`.

## Suggested acceptance criteria
The first slice is complete when all of the following are true:

### Landing page
- The landing page communicates the advisory-only product value within the first viewport.
- A primary CTA moves the user into the intake route.
- Coverage messaging for NSW, Victoria, and Queensland is visible.
- The page includes language that avoids presenting the product as formal approval advice.

### Intake shell
- The intake route renders a clearly guided multi-step shell.
- Step labels are visible and the current step is obvious.
- Users can move forward and backward through the shell without a page reload.
- The shell includes representative fields for:
  - project type
  - applicant profile
  - address / jurisdiction context
  - project scope notes
  - document-readiness/upload placeholder state
- The UI includes an advisory disclaimer or expectation-setting note before analysis begins.

### Engineering quality
- The slice uses App Router route boundaries instead of mockup-style screen toggling.
- Interactive behavior is implemented through React state, not manual DOM querying.
- Repeated content and step metadata are extracted from the route body where reasonable.
- The slice has route-level and interaction-level test coverage.

## TDD-first implementation order
The recommended order for worker implementation is:
1. Add the app scaffold and test harness.
2. Add a failing route/render test for the landing page.
3. Implement the landing route.
4. Add a failing navigation test for landing -> intake.
5. Implement the intake route shell.
6. Add failing tests for step navigation and disclaimer visibility.
7. Implement step transitions with local React state.
8. Refactor shared content and shell pieces only after tests pass.

## Minimum test contract for the slice
Worker 2's tests should at least prove:
- `/` renders the core hero/CTA/disclaimer content
- clicking the primary CTA lands on `/intake`
- `/intake` renders the shell with visible step labels
- next/back controls update the visible step state
- advisory language remains present on both routes

If time permits, also cover:
- keyboard-accessible step controls
- inactive-step hidden-state behavior
- stable rendering of the jurisdiction coverage strip

## Code-quality checklist for review
Use this checklist when reviewing the bootstrap PR/worktree:
- [ ] No inline styles copied from the mockup
- [ ] No DOM `querySelector` state orchestration in production components
- [ ] No giant route component holding unrelated markup without extraction
- [ ] Disclaimer/advisory wording preserved from planning intent
- [ ] Route structure maps to real product flow (`/` and `/intake`), not tab-switched screens
- [ ] shadcn/ui usage is selective and does not add unnecessary abstraction
- [ ] Tailwind utilities or shared variants replace ad-hoc CSS duplication
- [ ] Tests cover the primary CTA and the intake-step shell behavior

## Handoff notes for the next implementation pass
- Treat the mockup as the **visual and copy reference**, not the code template.
- Land the first slice as a **navigation + shell milestone**, not as a partial compliance engine.
- Keep the first slice deliberately thin so worker 1 and worker 2 can converge quickly without dragging in later-epic complexity.
- Preserve the calm/trustworthy tone from the mockup; avoid turning the first slice into generic B2B dashboard copy.

## Recommended next documentation updates after the slice lands
After the app scaffold exists, add:
1. a root `README.md` for local setup and scripts,
2. a concise component map for the landing/intake slice,
3. a short test inventory describing route and interaction coverage,
4. a change log entry documenting which mockup concepts became production UI.
