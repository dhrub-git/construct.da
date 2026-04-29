---
tracker:
  kind: linear
  project_slug: "replace-with-your-linear-project-slug"
  active_states:
    - Todo
    - In Progress
    - Merging
    - Rework
  terminal_states:
    - Closed
    - Cancelled
    - Canceled
    - Duplicate
    - Done
polling:
  interval_ms: 5000
workspace:
  root: ~/code/symphony-workspaces/da-approval
hooks:
  after_create: |
    git clone --depth 1 https://github.com/dhrub-git/da-approval .
    if [ -f package-lock.json ]; then
      npm ci
    else
      npm install
    fi
agent:
  max_concurrent_agents: 3
  max_turns: 20
codex:
  command: codex --config shell_environment_policy.inherit=all --config 'model="gpt-5.5"' --config model_reasoning_effort=high app-server
  approval_policy: never
  thread_sandbox: workspace-write
  turn_sandbox_policy:
    type: workspaceWrite
---

You are working on Linear issue `{{ issue.identifier }}` for the construct.da DA Approval repository.

{% if attempt %}
Continuation context:
- This is retry attempt #{{ attempt }} because the issue is still active.
- Resume from the current workspace state instead of restarting from scratch.
- Do not repeat already-completed validation unless new changes require it.
{% endif %}

Issue context:
- Identifier: {{ issue.identifier }}
- Title: {{ issue.title }}
- Current status: {{ issue.state }}
- Labels: {{ issue.labels }}
- URL: {{ issue.url }}

Description:
{% if issue.description %}
{{ issue.description }}
{% else %}
No description provided.
{% endif %}

Operating contract:

1. This is an unattended orchestration session. Never ask a human to perform routine follow-up.
2. Work only inside the provided repository copy.
3. Follow every applicable `AGENTS.md` instruction in the repo.
4. Keep diffs small, reviewable, and reversible. Prefer deletion over addition.
5. No new dependencies unless the issue explicitly requires one.
6. Default to TDD for new logic and interactive behavior: update or add a failing test first when practical.

Repository context:

- Framework: Next.js App Router
- Language: TypeScript
- Styling: Tailwind CSS v4 + shadcn/ui
- Test stack: Vitest + React Testing Library
- Product posture: advisory-only DA approval workflow for Australian residential projects

Linear + workflow rules:

- Use a single persistent `## Codex Workpad` comment as the execution log.
- Keep the issue state, checklist, validation notes, and PR link current in that workpad.
- Treat `Todo`, `In Progress`, `Rework`, and `Merging` as actionable states.
- Treat `Human Review` as waiting on a person; do not continue implementation unless the issue returns to an actionable state.
- When moving to `Merging`, follow the repo-local `land` skill.

Default execution loop:

1. Determine current issue state and route accordingly.
2. Create or resume the single `## Codex Workpad` comment.
3. Reproduce the issue or confirm the requested behavior before editing.
4. Make the smallest change that satisfies the ticket.
5. Re-run validation after each meaningful implementation batch.
6. Keep the workpad current with plan, progress, validation evidence, and blockers.

Validation requirements:

- Run `npm run test` for behavior changes.
- Run `npm run lint` before handoff.
- Run `npm run typecheck` before handoff.
- Run `npm run build` when route behavior, server behavior, build configuration, or cross-cutting app code changes make it relevant.
- If the Linear issue contains explicit Validation/Test Plan/Testing instructions, execute them fully before considering the work complete.

Blockers:

- Only stop early for true blockers such as missing auth, missing required external tools, or missing secrets.
- If blocked, record the exact blocker, why it prevents completion, and the minimal human action needed in the workpad.

Completion bar:

- Acceptance criteria are satisfied.
- Required validation is green.
- The workpad accurately reflects final status.
- Any PR created for the branch is updated and linked.
- Final response summarizes completed work and blockers only.
