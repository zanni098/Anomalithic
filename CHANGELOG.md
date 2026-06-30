# Changelog

All notable changes to Anomalithic are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); versioning is [SemVer](https://semver.org/).

## [0.2.0] — 2026-06-30

Greenfield rebuild into a functional, premium **multi-agent** harness. Supersedes the
prior line of releases (through `v0.1.4`); only the proven signed-impression trust
anchor and the frozen specs were carried forward.

### Added
- **Runtime** (`@anomalithic/runtime`): provider-agnostic agent loop with agent-defined
  thinking windows, typed event bus, and message/tool/provider interfaces.
- **Providers** (`@anomalithic/providers`): a **Free Models Router** (zero-cost default
  that routes around rate-limited free OpenRouter models), an OpenAI-compatible streaming
  provider (OpenRouter/OpenAI/Gemini/Ollama), a native Anthropic provider, and a
  swarm-aware Mock provider for offline demos.
- **Tools** (`@anomalithic/tools`): path-confined filesystem, guarded shell, and
  web_fetch tools with a registry.
- **Sessions** (`@anomalithic/sessions`): durable file-backed session store with resume
  and permission rulesets (subagent narrowing — a parent deny can't be overridden).
- **Swarm** (`@anomalithic/swarm`): an Orchestrator + 8 specialists (Researcher, Coder,
  Analyst, Writer, Slides, Docs, Image, Video) with `delegate`, `delegate_parallel`,
  and `handoff`, emitting a full agent-attributed trace.
- **MCP** (`@anomalithic/mcp`): MCP stdio client (official SDK) adapting MCP server tools
  into runtime tools.
- **Server** (`@anomalithic/server`): local HTTP runtime API; `/run` and `/swarm` stream
  the trace as SSE.
- **SDK** (`@anomalithic/sdk`): typed client consuming the SSE trace.
- **CLI** (`apps/cli`): `run`, `swarm`, `serve`, `models`.
- **Web** (`apps/web`): premium Next.js UI — "Lithic warmth" design system (Fraunces +
  Hanken Grotesk + JetBrains Mono, warm bone / deep-stone dark mode, halftone texture,
  the monolith mark), a live swarm console with animated trace visualization, and
  Framer-Motion choreography.
- **Desktop** (`apps/desktop`): Tauri shell rendering the web UI (configured; native
  build pending verification on a machine with the Rust toolchain).
- `ARCHITECTURE_NOTES.md` (reference study + plan) and `AUDIT.md` (run-tested audit).

### Carried forward
- Signed thinking-impression trust anchor (`@anomalithic/impressions`, with tests).
- Frozen specs under `docs/specs/`.

### Verified
- 41 tests passing; build, typecheck, and lint green.
- Live end-to-end: the swarm plans, runs Researcher + Writer in parallel, calls the real
  `web_fetch` tool, and synthesizes a final answer via the Free Models Router — shown in
  the CLI and in the web console.

### Deferred (later phases)
- Thinking-time ad marketplace, advertiser portal, and USDC wallet (trust anchor only in v1).
- Native desktop bundling verification; standalone TUI; messaging gateway.
