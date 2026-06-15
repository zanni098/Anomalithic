# Architecture

Anomalithic is a TypeScript monorepo (Bun-compatible, pnpm + Turborepo). Hot paths
are isolated behind interfaces so they can be re-implemented in Rust later without
churning the public API.

## Influences

Anomalithic distills ideas from a generation of agent harnesses:

| Project | What we borrow |
|---|---|
| **jcode** (Rust) | Fast harness, agent swarms, semantic-memory graph, many providers w/ OAuth + OpenAI-compatible endpoints, resumable sessions |
| **codebuff** (TS) | Multi-agent roles (picker/planner/editor/reviewer), any model, CLI + embeddable SDK, ad-supported tier precedent |
| **openclaw** (Node) | Local-first Gateway bridging 20+ messaging channels, sandboxed tool execution |
| **hermes-agent** (Py) | Self-improving learning loop, cron, subagent spawning, persistent searchable memory, pluggable terminal backends |
| **paperclip** (TS) | Org-of-agents control plane: task checkout, heartbeats, per-agent budget enforcement, governance |
| **Claude Code** | MCP client+server, plugins, skills (SKILL.md), hooks, subagents, cross-session memory, worktree isolation |

## Packages (current)

```
packages/
  providers/   Model-agnostic LLM layer. One `Provider` interface; Anthropic,
               OpenAI-compatible (OpenAI/OpenRouter/Ollama/local), and a Mock
               backend. Normalises every vendor onto a single StreamEvent type,
               with thinking_* events as first-class citizens.
  core/        The agent loop (gather → think → act → observe → repeat), a typed
               EventBus, signed thinking-impressions, and a ToolRegistry.
  cli/         The `anomalithic` CLI: config resolution, streaming output, and the
               Phase-0 placeholder ad renderer wired to thinking events.
```

## Key design decisions

### Provider-agnostic thinking windows
The ad feature must work on *any* model, including ones with no native reasoning
stream. So the **agent** — not the provider — defines the thinking window: it opens
at the start of each provider round-trip and closes at the first output token (or
tool call). Provider reasoning deltas are relayed within that window for display.
See `packages/core/src/agent.ts`.

### Signed impressions as the ad trust anchor
Each thinking window mints a `ThinkingImpression` — `{id, sessionId, turn, seq,
startedAt, signature}` — signed with an HMAC key held by the runtime. The future ad
ledger verifies the signature before crediting a watcher, so impressions cannot be
forged by a client. See `packages/core/src/impression.ts` and
[docs/specs/thinking-impressions.md](./docs/specs/thinking-impressions.md).

### Typed event bus
`EventBus` (`packages/core/src/events.ts`) is a tiny dependency-free pub/sub with a
typed event map (`turn.*`, `thinking.*`, `text`, `tool.*`, `done`, `error`). The CLI
renderer and the ad SDK are both just subscribers — they never touch the loop.

## Planned packages (see ROADMAP)

`mcp/` (client + server), `skills/` (Claude SKILL.md + Codex AGENTS.md),
`hooks/` (lifecycle), `memory/` (file index + semantic recall),
`orchestrator/` (subagents, budgets, heartbeat, resume), `gateway/` (messaging),
`sdk/`, `tui/`; `apps/desktop` (Tauri); `services/ads-*` + `wallet` (proprietary).
