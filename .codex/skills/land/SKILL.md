---
name: land
description:
  Merge a ready PR by ensuring it is current, validated, review-complete, and
  green. Use when a Symphony issue moves to `Merging`.
---

# Land

## Goals

- Ensure the PR is up to date with `origin/main`.
- Ensure required validation is green.
- Ensure actionable review feedback is addressed.
- Squash-merge only when the branch is ready.

## Workflow

1. Locate the PR for the current branch with `gh pr view`.
2. If the working tree is dirty, commit with the `commit` skill and publish with the `push` skill first.
3. Check PR mergeability.
4. If conflicts exist, run the `pull` skill, resolve them, revalidate, and push.
5. Review open PR comments, review summaries, and inline comments.
6. Address or explicitly respond to every actionable comment.
7. Run repository validation:
   - `npm run test`
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build` when relevant
8. Wait for checks with `gh pr checks --watch` when checks exist.
9. Squash-merge when the branch is clean, validated, and review-complete.

## Guardrails

- Do not merge while actionable review comments remain.
- Do not enable auto-merge as a substitute for validation.
- If CI fails, inspect the failing run, fix the issue locally, revalidate, push, and watch again.
