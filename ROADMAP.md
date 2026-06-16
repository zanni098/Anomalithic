# Roadmap

All pillars advance together, gated by demoable milestones. Each phase moves every
track forward a notch.

## Phase 0 — Foundations ✅ (this build)
- [x] Bun/pnpm/Turborepo monorepo, strict TS, Biome, Vitest, CI
- [x] Provider interface + Anthropic + OpenAI-compatible + Mock backends
- [x] Minimal agent loop with provider-agnostic thinking windows
- [x] Signed thinking-impressions (the ad trust anchor)
- [x] Tool registry + tool-use loop
- [x] `anomalithic` CLI: `run`, shorthand, `models`; streaming; placeholder ad renderer
- [x] Ads impression spec + memory format spec + ads threat-model stub

## Phase 1 — Core parity
- [ ] MCP client (stdio + streamable HTTP/SSE)
- [ ] Skills loader: Claude `SKILL.md` (frontmatter, lazy body) + Codex `AGENTS.md`
- [ ] Lifecycle hooks: SessionStart, PreToolUse, PostToolUse, Stop, PreCompact, Thinking
- [ ] Two-tier memory: `MEMORY.md` index + atomic fact files
- [ ] Context compaction at window pressure
- [ ] TUI (Ink); built-in tools (fs, shell, web)
- [ ] Single subagent spawn

## Phase 2 — Teams & endurance
- [ ] Orchestrator: durable task store, atomic task checkout, dependency graph
- [ ] Per-agent token/cost budgets with hard stops
- [x] Durable sessions + resume (survive restarts) — `SessionStore` + `anomalithic --resume` / `sessions`
- [x] Heartbeat loop for unattended multi-hour runs — `Orchestrator.runHeartbeat()`
- [x] Plugin system — `@anomalithic/plugins` (bundles skills + MCP + hooks) + `anomalithic plugins`
- [x] Interactive `chat` mode + full-screen **Ink TUI** (`anomalithic tui`)
- [ ] Worktree-isolated subagents that merge back
- [ ] Governance gates for risky/outbound actions
- [ ] Semantic memory recall (libsql / sqlite-vec)

## Phase 3 — Money (the killer feature)
- [ ] `ads-api`: inventory, serving, impression verification
- [ ] `advertiser-portal`: upload ad, set monthly budget, pay, analytics
- [ ] `wallet`: USDC-on-Base custody, 50/50 split, payout ledger
- [ ] Fraud resistance: signature + nonce + rate limits + thinking-time floor + velocity anomaly detection
- [ ] AML/KYC-lite + geofencing (hard legal gate before payouts)
- [ ] Web dashboard (sessions, memory, billing)

## Phase 4 — Reach
- [ ] Tauri desktop apps: Windows, Linux, macOS
- [x] Messaging gateway (openclaw-style) — `@anomalithic/gateway` with Telegram + mock adapters (Slack/Discord/WhatsApp/Signal next)/iMessage
- [ ] Scheduled routines (cron)
- [ ] Advertiser analytics

## Phase 5 — Scale & native
- [ ] Mobile (Tauri 2 / Capacitor) beta
- [ ] Rust hot-path sidecar (harness loop, TUI render, embeddings)
- [ ] Swarm scale testing & hardening
- [ ] Self-improving skills (learning loop)
- [ ] Payout cash-out + fiat on-ramp

## Cross-cutting risks tracked throughout
- AML/KYC and tax treatment of paid watchers (legal gate in Phase 3)
- Ad-impression fraud (the economy fails if impressions are spoofable)
- Per-provider ToS on ad-funded inference resale
- Scope: six pillars at once — milestone gates keep each phase shippable alone
