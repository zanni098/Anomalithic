# Contributing to Anomalithic

Thanks for your interest! Anomalithic is early (Phase 0) and the architecture is
still settling, so the most useful contributions right now are focused PRs and
design feedback on the [roadmap](./ROADMAP.md).

## Prerequisites

- Node.js ≥ 20 (Node 24 recommended)
- pnpm ≥ 10 (`corepack enable` then `corepack prepare pnpm@latest --activate`)

## Setup

```bash
pnpm install
pnpm build
pnpm test
```

## Project conventions

- **TypeScript strict.** No `any` where a real type fits; prefer small, focused modules.
- **Immutability.** Return new objects rather than mutating inputs.
- **Many small files** over few large ones; keep files under ~400 lines.
- **Tests with behavior-revealing names** (Arrange-Act-Assert). New core logic ships with tests.
- **Lint/format with Biome.** Run `pnpm lint` and `pnpm exec biome check --write .` before pushing.

## Before opening a PR

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

All four must pass; CI runs the same set. Keep PRs scoped to one concern and
reference the roadmap phase they advance.

## Commit messages

Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`,
`perf:`, `ci:`.

## Licensing of contributions

Contributions to the open `packages/*` and `apps/desktop` are accepted under the
Apache-2.0 license. Do not submit code derived from the proprietary services to the
open packages.
