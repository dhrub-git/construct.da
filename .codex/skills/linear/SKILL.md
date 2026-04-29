---
name: linear
description: |
  Use Symphony's `linear_graphql` client tool for raw Linear GraphQL work
  during app-server sessions.
---

# Linear GraphQL

Use this skill for raw Linear GraphQL operations when Symphony injects the
`linear_graphql` client tool into the Codex app-server session.

## Tool shape

```json
{
  "query": "query or mutation document",
  "variables": {
    "optional": "graphql variables object"
  }
}
```

## Guidelines

- Send one GraphQL operation per tool call.
- Treat a top-level `errors` array as a failed operation.
- Request only the fields you need.
- Prefer explicit issue identifiers and ids over broad searches.

## Common use cases

- read issue details
- update issue state
- create or update the single `## Codex Workpad` comment
- inspect attachments and linked PR metadata
- add concise blocker or completion notes when the workflow requires them
