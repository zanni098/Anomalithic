# Anomalithic — Architecture Notes (Phase 1)

> Study of the two reference projects + a concrete rebuild plan for Anomalithic.
> **Status: awaiting approval before any code is written.**
> Date: 2026-06-29

---

## 0. TL;DR

We are doing a **greenfield rewrite** of Anomalithic into a genuinely functional,
visually premium, multi-agent harness with **both a web app and a desktop app**,
provider-agnostic models (free router + Anthropic/OpenAI/Gemini + Ollama), and real
MCP tool connectors. The agent loop and the multi-agent *swarm* are the headline
experience. The signature product identity — the **thinking-time ad / signed
impression** concept and the model-agnostic positioning — is preserved.

The two references give us complementary blueprints:

- **OpenSwarm** → the *multi-agent model*: an Orchestrator that never answers directly,
  a roster of specialists, and two communication primitives (`SendMessage`, `Handoff`).
  Plus the **visual language** (from the desktop screenshots): warm cream gradient,
  dark rail, serif display headings, dotted halftone texture, App-Builder card UI.
- **opencode** → the *harness engineering*: a strongly-typed tool contract, sessions
  as the unit of work, **subagents as child sessions** spawned by a `task` tool,
  permissions, streaming, MCP, and a clean monorepo that ships a CLI + TUI + Electron
  desktop + web.

Both are **MIT-licensed**, so we may adapt patterns and small snippets with
attribution (see §6).

---

## 1. Reference A — OpenSwarm (VRSEN/OpenSwarm)

**Stack:** Python. Built on **Agency Swarm** (a thin layer over the OpenAI Agents SDK).
Multi-provider via **LiteLLM**. Terminal-only (the README is explicit: "No platform,
no UI"). Optional FastAPI `server.py` + a slides preview server.

### 1.1 How it harnesses the LLM
- Each agent is an `Agent(...)` declared **declaratively**: `name`, `description`,
  `instructions` (a markdown file), `model`, `model_settings` (reasoning effort,
  summaries), `tools`, `files_folder`, `conversation_starters`.
- The loop itself is owned by Agency Swarm / the Agents SDK — gather → reason →
  tool-call → observe → repeat, with reasoning summaries surfaced when the provider
  supports them (`Reasoning(effort=..., summary="auto")`).
- Provider routing (`config.py`): a model id with **no slash** = OpenAI direct; any
  `provider/model` string is routed through `LitellmModel`. `DEFAULT_MODEL` env selects.

### 1.2 Multi-agent orchestration (the important part)
- `create_agency()` instantiates **8 agents**: an **Orchestrator** (pure coordinator,
  *never answers directly*) + 7 specialists (Virtual Assistant, Deep Research, Data
  Analyst, Slides, Docs, Image-gen, Video-gen).
- Two communication primitives wired as a graph:
  - **`SendMessage`** — Orchestrator → each specialist (delegation; control returns).
  - **`Handoff`** — every agent → every other agent (transfer of control).
  - i.e. `send_message_flows = [(orchestrator, specialist, SendMessage) ...]` and a
    full mesh of `(a > b, Handoff)`.
- `shared_instructions.md` is injected into every agent. Threads persist via a
  `load_threads_callback`.

### 1.3 Tools / connectors
- Tools are pydantic `BaseTool` subclasses with a `run()` method (typed fields = the
  JSON schema the model sees).
- **Composio** integration is the connector story: `SearchTools`, `FindTools`,
  `ExecuteTool` (single call), `ManageConnections` → ~10k external services
  (Gmail/Slack/GitHub/…). For multi-step/data work, an **IPython interpreter** tool
  runs code in an isolated kernel.
- `model_availability.py` shows a nice UX pattern: tools self-report which providers/
  add-ons are configured and tell the user exactly which key to add.

### 1.4 What's worth borrowing
- **Orchestrator-as-router** that never answers directly.
- **Two-primitive** communication model (delegate vs hand-off) — small, legible.
- **Declarative agent definitions** with per-agent instructions files + starters.
- The **specialist roster** idea (a small set of capable, well-scoped agents).
- Tools that **self-describe availability** and guide the user to fix missing keys.

---

## 2. Reference B — opencode (sst/opencode)

**Stack:** TypeScript on **Bun**, ~30 packages in a Turborepo, **Effect** (typed
effects + Layer DI + Schema) throughout. LLM via the **Vercel AI SDK** plus a native
request runtime; model catalog from **models.dev**.

### 2.1 How it harnesses the LLM
- **Sessions** are the unit of work (`Session.Service`): created with a `parentID`,
  `agent`, `permission` set, title. They stream message parts (`message-v2.ts`),
  support compaction at context pressure (`compaction.ts`), retries (`retry.ts`),
  revert/snapshot, and durable resume.
- The processor (`session/processor.ts`) drives the turn loop; `session/llm/*` wraps
  both the AI SDK path and a native provider runtime; `prompt.ts` assembles the system
  prompt + instruction context.

### 2.2 Tool contract (clean, worth copying closely)
```ts
Tool.define(id, Effect.gen(...) => ({
  description, parameters /* Effect Schema */, jsonSchema?,
  execute(args, ctx): Effect<{ title, metadata, output, attachments? }>
}))
```
- The wrapper validates args against the schema (a typed `InvalidArgumentsError`
  tells the model to *rewrite its input*), truncates large output to a file, and emits
  an OpenTelemetry span per call. `ctx` carries `sessionID`, `messageID`, `agent`,
  `abort`, `ask()` (permission prompt), `metadata()`.
- Built-in tools: `read/write/edit/apply_patch/glob/grep/ls/shell/webfetch/websearch/
  lsp/todo/question/plan/skill/task`.

### 2.3 Multi-agent = subagents as child sessions
- The **`task` tool** is opencode's multi-agent mechanism. It:
  - resolves a `subagent_type` to an **Agent.Info** (`mode: subagent|primary|all`,
    own model, prompt, **permission ruleset**, color),
  - creates a **child Session** (`parentID = current`, **derived/narrowed
    permissions** so a subagent can't exceed its parent),
  - runs it **foreground** (race the background job's completion) or **background**
    (a `BackgroundJob` service; the parent is notified and the result injected as a
    synthetic message),
  - renders results as `<task id state>…</task>` blocks.
- This is a **parent→child delegation tree**, not a peer mesh. It is durable,
  cancellable, and permission-scoped. Excellent model to adopt.

### 2.4 Surfaces & packaging
- `cli`, `tui` (rich terminal UI), **`desktop` = Electron** (electron-vite +
  electron-builder, win/mac/linux), **`web` = Astro**, `app` = Vite/Solid SPA,
  `server` (HTTP API the UIs call), `sdk`/`sdk-next` (typed client), `mcp`, `plugin`,
  `skill`, `permission`, `share`. Hot logic isolated behind services/interfaces.

### 2.5 What's worth borrowing
- The **typed tool contract** + validate/truncate/telemetry wrapper.
- **Sessions-as-unit** + **subagent-as-child-session** with **derived permissions**.
- **Foreground/background** subagent execution with completion notifications.
- A **runtime server** that every UI (web/desktop/cli) talks to → one brain, many faces.
- **Permission system** with allow/deny/ask rulesets, narrowed for subagents.

---

## 3. Audit of the current Anomalithic (kill / keep / rewrite)

The repo is **not** "mostly broken" — it builds and the mock agent loop runs
(`node packages/cli/dist/index.js run -p mock "hello"` → clean output + a signed
impression). It's a 13-package pnpm/Turborepo monorepo. Docs are stale
(`ARCHITECTURE.md` lists mcp/skills/hooks/memory/orchestrator as "planned" while they
exist as built packages). Given the **greenfield** decision, this is the salvage list:

| Area | Verdict | Notes |
|---|---|---|
| `packages/core` agent loop + typed EventBus | **Rewrite** | Re-do as the new swarm-capable loop; keep the event-bus *idea*. |
| `packages/core/src/impression.ts` (signed thinking-impressions) | **KEEP (port)** | This is the product's trust anchor and is proven; port verbatim with tests. |
| `docs/specs/thinking-impressions.md`, memory-format spec | **KEEP** | Frozen specs; reuse. |
| `packages/providers` (Anthropic/OpenAI-compat/Gemini/Ollama/Mock) | **Rewrite on AI SDK** | Re-implement on Vercel AI SDK for breadth + add the **Free Models Router**. |
| `packages/{mcp,skills,hooks,memory,orchestrator,security,os,plugins,gateway}` | **Rewrite selectively** | Re-derive against opencode patterns; keep concepts, not code. |
| `packages/cli`, `packages/tui` | **Rewrite (thin)** | CLI/TUI become thin clients of the new runtime server. |
| `apps/web` (Next.js) | **Rewrite** | New premium design system; keep Vercel deploy target. |
| `apps/desktop` (Tauri) | **Rewrite** | Wrap the same React UI; decision point below (Tauri vs Electron). |
| `services/ads-*` (Supabase) | **Keep schema, defer** | Money/ads is Phase 3 of the product; out of v1 scope. |

A full `AUDIT.md` (per-feature, run-tested) is produced as the first deliverable of the
build phase.

---

## 4. Proposed architecture for the rebuilt Anomalithic

**One brain, many faces.** A TypeScript runtime exposes a streaming local API; the web
app and the desktop app are the same React UI over that API.

```
anomalithic/ (pnpm + Turborepo, strict TS, Vitest, Biome)
├─ packages/
│  ├─ runtime/        Agent loop, turn state, streaming event bus, context assembly,
│  │                  compaction. (core of opencode's processor, our shape)
│  ├─ swarm/          Orchestrator + specialists; delegate(SendMessage-style) +
│  │                  handoff(transfer) over a parent→child SESSION tree (opencode's
│  │                  task model fused with OpenSwarm's orchestrator roster).
│  ├─ providers/      Unified Provider over the Vercel AI SDK: Anthropic, OpenAI,
│  │                  Google Gemini, OpenRouter **Free Models Router**, Ollama, Mock.
│  ├─ tools/          Typed tool contract (define/parameters/execute→{title,output,…}),
│  │                  built-ins: fs, shell, web fetch/search, code. Validate+truncate.
│  ├─ mcp/            MCP stdio + streamable-HTTP client; expose MCP tools as agent tools.
│  ├─ sessions/       Durable sessions + resume + permissions (allow/deny/ask, derived
│  │                  for subagents).
│  ├─ memory/         File-backed cross-session memory (MEMORY.md index + atomic facts).
│  ├─ impressions/    Ported signed thinking-impression (the ad trust anchor).  [KEEP]
│  ├─ server/         Local HTTP + WebSocket/SSE runtime API the UIs consume.
│  ├─ design/         Design tokens + component library (shared web+desktop).
│  └─ sdk/            Typed client for the server (used by web, desktop, cli).
├─ apps/
│  ├─ web/            Next.js (App Router) + Framer Motion. → Vercel.
│  ├─ desktop/        Tauri shell rendering the React UI; runtime sidecar.  [decision §5]
│  └─ cli/            Thin CLI/TUI over the SDK.
└─ docs/  ARCHITECTURE_NOTES.md, AUDIT.md, specs/…
```

**Agent/swarm model (synthesis of both references):**
- An **Orchestrator** primary agent that plans and routes, never does the work itself.
- The **specialist roster** (declarative: name, description, system prompt, model,
  tools, permission ruleset, color): **Researcher, Coder, Analyst, Writer** (core) plus
  the OpenSwarm-style **media specialists — Slides, Docs, Image-gen, Video-gen**.
  Media specialists wire to the generation connectors available in this environment.
- **Delegate** = spawn a child session, await its result, control returns (OpenSwarm
  `SendMessage` ≈ opencode foreground `task`).
- **Handoff** = transfer control to another agent for tight iteration (OpenSwarm
  `Handoff`).
- **Background subagents** for independent parallel work, with completion injection.
- Every step is **streamed and traced** to the UI (thinking, tool calls, handoffs).

**Provider strategy:** Vercel AI SDK gives streaming + tool-calling across providers
cheaply. The **Free Models Router** picks healthy free OpenRouter models by default
(zero-cost first run); paid providers and local Ollama are opt-in via keys/endpoint.

**UI / design system (premium, from the OpenSwarm visual language):**
- Tokens: warm sand/cream surfaces, near-black rail, a single warm-terracotta accent,
  serif display + clean sans body, soft radii, layered shadows; full dark mode.
- **Custom interactive graphics**: bespoke modals/popovers (no default dialogs), an
  **"agent thinking"** state, animated **swarm/handoff** visualization, toasts, step
  transitions, animated empty/onboarding states — choreographed with Framer Motion.
- Surfaces: session chat, live **trace/activity timeline** (thinking + tool calls +
  handoffs), agent/swarm builder, model/provider config, memory & skills browser.

---

## 5. Resolved decisions (locked 2026-06-29)

1. **Desktop shell → Tauri.** Lightweight (matters on the 16GB machine); renders the
   same React UI as web via the system webview.
2. **Signed-impression code → KEEP / port verbatim with tests.** It is the product's
   trust anchor and already works.
3. **Specialist roster → full.** Orchestrator + core {Researcher, Coder, Analyst,
   Writer} + media {Slides, Docs, Image-gen, Video-gen}.
4. **v1 demo target.** *Give the Orchestrator a goal → it plans, delegates to 2–3
   specialists (some in parallel/background) with live handoff + trace visualization,
   calls a real MCP tool and a free-router model, streams a final result* — shown in
   **both** the web app and the Tauri desktop app. (Adjustable as build progresses.)
5. **Ads/money scope → trust anchor only in v1.** Keep the signed impression + the
   "ad shows only while thinking" placeholder; defer the real ad marketplace, advertiser
   portal, and USDC wallet to a later phase.
6. **Repo strategy → new branch, in-place.** Greenfield on a new branch of
   `zanni098/Anomalithic`; old code removed in the rewrite commit; history preserved.

---

## 6. Licensing

Both references are **MIT**. We may freely adapt patterns and small code snippets
provided we retain attribution. Any file substantially adapted from a reference will
carry a header crediting `sst/opencode` (MIT) or `VRSEN/OpenSwarm` (MIT). Anomalithic
stays open-core Apache-2.0 for the runtime; the hosted ad marketplace remains
proprietary (unchanged).

---

## 7. Build plan (phased, demoable gates) — for approval

- **M0 — Scaffold + AUDIT.md.** New monorepo skeleton; run-tested per-feature audit of
  the old repo; port signed-impressions with tests. *Demo: `pnpm test` green; mock loop runs.*
- **M1 — Single-agent harness.** runtime + providers (incl. Free Models Router) + typed
  tools (fs/shell/web) + sessions + streaming server + SDK. *Demo: CLI + a minimal web
  page stream a real free-model answer that calls a tool.*
- **M2 — Multi-agent swarm.** Orchestrator + specialists, delegate/handoff/background,
  permissions, MCP client. *Demo: the §5.4 end-to-end run, traced.*
- **M3 — Premium UI.** Design system, both web + desktop, custom graphics + motion,
  live swarm/trace visualization, agent builder. *Demo: the v1 demo, polished, in both apps.*
- **M4 — Release.** Memory browser, docs, README/CHANGELOG, semver bump, clean runnable repo.

Each milestone is self-reviewed and run before moving on. I will pause for your sign-off
on this plan (and the §5 answers) before writing any code.
