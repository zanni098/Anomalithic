# Spec: Cross-Session Memory Format

Status: **draft (v0)** — implemented in Phase 1 (`packages/memory`).

Anomalithic remembers across sessions using two tiers, mirroring patterns that work
well in practice.

## Tier 1 — Human-readable file store

A per-scope directory (user-global and per-project):

```
.anomalithic/memory/
  MEMORY.md            # index: one line per fact, loaded into context each session
  <slug>.md            # one atomic fact per file
```

### Atomic fact file
```markdown
---
name: <kebab-case-slug>
description: <one-line summary used for recall relevance>
type: user | project | feedback | reference
created: 2026-06-16            # ISO 8601 date (YYYY-MM-DD), absolute, never relative
---

<the fact in prose. Link related facts with [[other-slug]].>
```

### Index line (`MEMORY.md`)
```
- [Title](slug.md) — short hook describing when this fact matters
```
`MEMORY.md` holds only index lines (no fact bodies) and is injected at
`SessionStart`.

## Tier 2 — Semantic recall

Each fact is embedded and stored in a local vector index (libsql / sqlite-vec) at
`.anomalithic/memory/index.db`. On a query, the top-k semantically similar facts are
surfaced even when not in the loaded index. Tier 1 is the source of truth; Tier 2 is
a derived cache and can be rebuilt from the `.md` files.

## Rules

- Convert relative dates ("last week") to absolute ISO dates on write.
- Prefer updating an existing fact over creating a near-duplicate.
- Do not store what the repo/git already records; store the non-obvious.
- Scope: project memory lives under the project; user memory under the user home.

## Date format

All dates are ISO 8601 (`YYYY-MM-DD` for dates, RFC 3339 for timestamps). Epoch
milliseconds are used only for machine fields like impression `startedAt`.
