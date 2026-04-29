---
name: push
description:
  Push the current branch, then create or update the matching GitHub pull
  request. Use when Symphony/Codex needs to publish validated work.
---

# Push

## Prerequisites

- `gh` is installed and authenticated.
- Local validation for the current scope is green.

## Required validation for this repository

Run the strongest relevant subset before pushing:

```bash
npm run test
npm run lint
npm run typecheck
```

Also run `npm run build` when route, server, or build-sensitive code changed.

## Workflow

1. Identify the current branch.
2. Push to `origin`, adding upstream tracking if needed.
3. If the push is rejected because the branch is stale, follow the `pull` skill, revalidate, and push again.
4. Create a PR if missing; otherwise update the existing PR.
5. Ensure the PR title matches the full scope of the branch.
6. Ensure the PR body includes at least:
   - summary of the shipped change
   - validation commands run
   - notable risks or follow-ups
7. Add the `symphony` label if it is missing.
8. Reply with the PR URL.

## Guardrails

- Use `--force-with-lease` only if history was intentionally rewritten.
- Treat auth/permission failures as blockers; surface the exact error instead of rewriting remotes.
