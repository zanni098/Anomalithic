# Anomalithic — Audit of the existing repo (Phase 2)

> Run-tested audit of the pre-rebuild codebase, with a kill/keep/rewrite verdict per
> area. Performed on branch `rebuild/v1`, 2026-06-29, before any greenfield work.

## Method

Everything below was **actually run**, not inferred:

| Check | Command | Result |
|---|---|---|
| Build artifacts present | `ls packages/cli/dist` | ✅ `index.js` present |
| Mock agent loop | `node packages/cli/dist/index.js run -p mock "hello"` | ✅ streams output + mints 1 signed impression |
| Test suite | `npx vitest run` | ✅ **38 tests / 16 suites passed** in 5.8s |
| CLI surface | `… --help` | ✅ `run, chat, tui, serve, models, skills, memory, plugins, mcp, sessions` |

**Headline finding:** the brief's premise ("most features don't work") is **inaccurate**
for the runtime. The harness builds, tests pass, and the core loop runs. There *is* a real
web UI too — `apps/web` ships a multipage Next.js site (App Router under `app/`, not
`src/`) with a drag-and-drop `AgentBuilder`, particle-field graphics, and a cream/Anthropic
aesthetic that already echoes the OpenSwarm visual language; `apps/desktop` is a Tauri
shell with an HTML UI. The real gaps are (a) the UI is **rough / not premium** and not a
coherent design system; (b) **stale docs** (`ARCHITECTURE.md` calls shipped packages
"planned"); (c) features that are real but **thin/early** (single-subagent only, no swarm,
minimal MCP client). The decision to go **greenfield** is therefore a product/architecture
choice, not a rescue — the audit's job is to mark what to **salvage** vs. **re-derive**.

> Note: the old web app's cream aesthetic is worth mining as a starting palette in M3 — it
> is recoverable from git (`main` branch) even though the rewrite removes it here.

## Per-area verdict

| Area | LOC (src) | Works? | Verdict | Rationale |
|---|---|---|---|---|
| `core` agent loop + EventBus | 446 | ✅ tests pass | **Rewrite** | Re-do as swarm-capable runtime; keep the typed-event-bus idea. |
| `core/impression.ts` (signed impressions) | — | ✅ | **KEEP — port verbatim** | Self-contained (`node:crypto`), proven, is the ad trust anchor. |
| `providers` (Anthropic/OpenAI-compat/Gemini/Ollama/Mock) | 670 | ✅ tests pass | **Rewrite on AI SDK** | Rebuild on Vercel AI SDK for breadth; add **Free Models Router**. |
| `mcp` (stdio client) | 161 | ✅ tests pass | **Rewrite** | Minimal; re-derive against opencode (stdio + streamable HTTP/SSE). |
| `skills` (SKILL.md + AGENTS.md loader) | 95 | ✅ | **Rewrite (port concept)** | Keep two-format loader idea. |
| `hooks` (lifecycle) | 101 | ✅ | **Rewrite (port concept)** | Keep hook points. |
| `memory` (MEMORY.md + facts) | 189 | ✅ | **Rewrite (port concept)** | Keep two-tier file memory. |
| `orchestrator` (durable tasks, heartbeat) | 227 | ✅ | **Rewrite** | Fold into new `swarm` + `sessions`; adopt opencode child-session model. |
| `security` (redaction, policy, sandbox) | 131 | ✅ | **Rewrite (port concept)** | Becomes the permission/redaction layer. |
| `os` (kernel composing packages) | 79 | ✅ | **Rewrite** | Replaced by new `runtime`/`server` composition. |
| `plugins` | 83 | ✅ | **Rewrite (port concept)** | Bundles skills+MCP+hooks. |
| `cli` | 519 | ✅ | **Rewrite (thin)** | Becomes a thin client over the new SDK/server. |
| `tui` (Ink) | 137 | ✅ | **Defer/rewrite** | Not a v1 priority (web+desktop are the UI focus). |
| `gateway` (Telegram/mock) | 238 | ✅ tests pass | **Defer** | Messaging channels are post-v1. |
| `apps/web` (Next.js) | real (`app/` + components, drag-drop builder) | ⚠️ rough, not a design system | **Rewrite** | New premium design system; mine old cream palette; Vercel target kept. |
| `apps/desktop` (Tauri) | Tauri shell + HTML UI | ⚠️ minimal | **Rewrite** | Wrap shared React UI in Tauri. |
| `services/ads-api` | 125 | n/a (needs Supabase) | **Defer** | Phase 3 money; keep schema. |
| `services/ads-db` (Supabase schema) | — | n/a | **Keep (defer)** | Reuse ledger/wallet schema later. |

## What carries forward verbatim
- `packages/core/src/impression.ts` → new `packages/impressions` (with tests).
- `docs/specs/thinking-impressions.md` and the memory-format spec → reused as frozen specs.
- The product identity: model-agnostic positioning + thinking-time-ad trust anchor.

## What is intentionally dropped from v1
- Real ad marketplace / advertiser portal / USDC wallet (deferred).
- Messaging gateway, standalone Ink TUI (deferred; web + desktop are the v1 surfaces).
