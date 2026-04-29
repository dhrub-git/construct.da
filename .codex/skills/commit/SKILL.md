---
name: commit
description:
  Create a repo-compliant git commit using this repository's Lore commit
  protocol. Use when a Symphony/Codex session needs to commit finished work.
---

# Commit

## Goals

- Commit only the intended files.
- Match the commit message to the actual diff.
- Follow the repository's Lore commit protocol.

## Workflow

1. Inspect `git status`, `git diff`, and `git diff --staged`.
2. Stage only the intended changes.
3. Sanity-check for accidental artifacts such as logs, caches, build outputs, or secrets.
4. Write the commit message in Lore format:
   - first line explains **why** the change exists
   - body explains context, constraints, and approach
   - trailers use git-native `Key: value` format
5. Prefer these trailers when relevant:
   - `Constraint:`
   - `Rejected:`
   - `Confidence:`
   - `Scope-risk:`
   - `Reversibility:`
   - `Directive:`
   - `Tested:`
   - `Not-tested:`
6. Use `git commit -F <file>` or a here-doc so formatting is preserved.

## Guardrails

- Do not use a conventional-commit prefix unless the user explicitly asks for one.
- Do not describe work that is not present in the staged diff.
- Do not omit validation evidence when tests or checks were run.
- If the diff includes unrelated files, fix staging before committing.
