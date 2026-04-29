---
name: pull
description:
  Sync the current branch with `origin/main` using a merge-based flow. Use when
  Symphony/Codex needs to refresh a working branch before continuing.
---

# Pull

## Workflow

1. Ensure the working tree is clean, or commit/stash changes first.
2. Enable rerere locally when available:
   - `git config rerere.enabled true`
   - `git config rerere.autoupdate true`
3. Fetch latest refs:
   - `git fetch origin`
4. Sync the remote feature branch first:
   - `git pull --ff-only origin $(git branch --show-current)`
5. Merge latest main with richer conflict context:
   - `git -c merge.conflictstyle=zdiff3 merge origin/main`
6. If conflicts appear:
   - inspect intent on both sides before editing
   - resolve one file at a time
   - run `git diff --check` before finalizing
7. After the merge, run the repo verification needed for the changed surface.
8. Record brief evidence for the workpad or handoff notes:
   - merge source
   - whether conflicts occurred
   - resulting `HEAD` short SHA

## Ask only when necessary

Proceed autonomously unless the correct resolution depends on product intent that cannot be inferred from code, tests, or local docs.
