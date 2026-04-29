# Project AGENTS.md - DA Approval

This file adds repo-specific guidance for the DA Approval MVP. It supplements, but does not override, higher-level OMX and user instructions.

## Intent
Build the advisory DA approval MVP as a Next.js App Router application using TypeScript, Tailwind CSS v4, and shadcn/ui, with TDD-first execution and small, verifiable vertical slices.

## Current stack contract
- Framework: Next.js App Router
- Language: TypeScript
- Styling: Tailwind CSS v4
- UI primitives: shadcn/ui
- Package manager: npm
- Test focus: Vitest + React Testing Library for unit/component coverage; add end-to-end coverage once the first flows exist

## Delivery posture
- Implement the product incrementally, not all at once.
- Prefer one working vertical slice at a time:
  1. app scaffold and test harness
  2. design system and layout shell
  3. intake flow
  4. project workspace
  5. report and findings views
  6. reviewer workflow
- Keep product logic separate from presentation so compliance logic can be tested without rendering UI.

## TDD rules
- For new logic and interactive components, write or update tests first.
- Start with the smallest failing test that proves the next behavior.
- Make the test pass with the minimum implementation.
- Refactor only after green tests.
- If a behavior is hard to test, simplify the design before adding complexity.
- Prefer pure functions for domain logic and thin UI adapters around them.

## Next.js rules
- Default to Server Components; add `"use client"` only when state, events, or browser APIs are required.
- Keep server/client boundaries explicit and small.
- Avoid data-fetch waterfalls; fetch in parallel where dependencies allow.
- Minimize data passed from server components to client components.
- Use direct imports; avoid barrel files when building app code.

## shadcn/ui and Tailwind rules
- Prefer shadcn/ui components before custom primitives.
- Use semantic Tailwind tokens and component variants; avoid hardcoded palette classes when a semantic token exists.
- Use `gap-*`, not `space-x-*` / `space-y-*`.
- Use `size-*` when width and height match.
- Compose app surfaces with layout, spacing, and typography first; do not default to dashboard-card grids.
- Keep the UI restrained, trust-first, and professional rather than decorative.

## Initial UX direction
- Visual thesis: calm, high-trust approvals workspace with strong hierarchy and minimal chrome.
- Content plan: focused hero/introduction, guided intake, project workspace, evidence-backed advisory report.
- Interaction thesis: subtle step transitions, clear status changes, lightweight emphasis on risk/confidence states.

## File organization target
- `app/` - routes and route-level layouts
- `components/` - reusable UI and feature components
- `lib/` - domain logic, helpers, schemas, and server utilities
- `test/` or colocated `*.test.ts(x)` - tests close to behavior where practical
- `docs/` - planning, PRD, implementation notes

## Verification before claiming progress
At meaningful checkpoints, run the strongest relevant subset of:
- `npm test`
- `npm run lint`
- `npm run typecheck`
- targeted build or route checks

Do not claim a slice is done unless the new behavior is implemented and verified.
