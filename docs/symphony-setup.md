# Symphony setup for this repository

This repository now includes a repo-local `WORKFLOW.md` and optional Codex skills so you can run [OpenAI Symphony Elixir](https://github.com/openai/symphony/blob/main/elixir/README.md) against this project.

## What was added

- `WORKFLOW.md` — repo-specific Symphony workflow contract for this codebase
- `.codex/skills/commit` — commit guidance adapted to this repo's Lore commit protocol
- `.codex/skills/pull` — merge-based branch sync guidance
- `.codex/skills/push` — push + PR publishing guidance for this repo
- `.codex/skills/land` — merge-to-main guidance for Symphony `Merging` state
- `.codex/skills/linear` — raw Linear GraphQL guidance for Symphony sessions

## Prerequisites

Before running Symphony, make sure all of these are true:

1. `codex` is installed, authenticated, and supports `codex app-server`
2. `gh` is installed and authenticated for this repository if you want PR automation
3. You have a Linear personal API key
4. You have the Symphony Elixir runtime checked out locally
5. Elixir/Erlang tooling is available (the Symphony README recommends `mise`)

## 1. Create the required Linear workflow states

The repo-local workflow assumes these Linear states exist for the relevant team/project:

- `Todo`
- `In Progress`
- `Human Review`
- `Merging`
- `Rework`
- terminal states such as `Done`, `Closed`, `Cancelled`, or `Duplicate`

`Human Review`, `Merging`, and `Rework` are the non-standard states called out in the Symphony README.

## 2. Set required environment variables

At minimum:

```bash
export LINEAR_API_KEY=your_linear_personal_api_key
```

You can also override Symphony workspace placement if needed by editing `WORKFLOW.md`.

## 3. Update the Linear project slug in `WORKFLOW.md`

Edit this value before your first run:

```yaml
tracker:
  project_slug: "replace-with-your-linear-project-slug"
```

To find the slug, open the Linear project in the browser and copy it from the project URL, as described in the Symphony README.

## 4. Clone and prepare Symphony Elixir

Example:

```bash
git clone https://github.com/openai/symphony.git
cd symphony/elixir
mise trust
mise install
mise exec -- mix setup
mise exec -- mix build
```

## 5. Start Symphony against this repository's workflow

From the Symphony Elixir checkout:

```bash
mise exec -- ./bin/symphony /absolute/path/to/da-approval/WORKFLOW.md
```

Useful optional flags from the Symphony README:

```bash
mise exec -- ./bin/symphony /absolute/path/to/da-approval/WORKFLOW.md --port 4050
mise exec -- ./bin/symphony /absolute/path/to/da-approval/WORKFLOW.md --logs-root /absolute/path/to/da-approval/log
```

- `--port 4050` enables the local observability dashboard
- `--logs-root ...` keeps Symphony logs in a repo-local directory

## Repo-specific behavior in this workflow

The added `WORKFLOW.md` is customized for this codebase:

- clones `https://github.com/dhrub-git/da-approval`
- bootstraps dependencies with `npm ci`
- validates with `npm run test`, `npm run lint`, and `npm run typecheck`
- asks for `npm run build` when route/server/build-sensitive changes are made
- keeps changes aligned with the repo's root `AGENTS.md`

## Notes

- `WORKFLOW.md` intentionally leaves the Linear project slug as a required manual value because it cannot be inferred reliably from the repository.
- The repo-local `.codex/skills/*` files are optional conveniences for Symphony/Codex sessions; Symphony itself only requires the workflow file plus the runtime setup from the upstream README.
