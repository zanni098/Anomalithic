# Anomalithic

**One open-core, model-agnostic agent runtime to rule them all.**

Anomalithic is an AI agent runtime designed to match the capability of tools like
Claude Code while staying provider-agnostic and self-hostable. It runs for minutes
or days, spawns teams of sub-agents, speaks MCP, loads Claude *and* Codex skills,
fires lifecycle hooks, remembers across sessions, reaches you on any messaging
channel — and funds itself through a thinking-time ad network paid out in
stablecoin.

> Status: **Phase 0 (Foundations).** The provider layer, agent loop, signed
> thinking-impressions, and CLI are real and tested. Multi-agent, ads, desktop
> apps, and the messaging gateway are on the [roadmap](./ROADMAP.md).

## Why

The name is *anomaly* + *-lithic* (stone / monolith): the one monolithic agent,
distilling the best ideas from a generation of agent harnesses into a single,
coherent runtime. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design and
the projects that inspired it.

## The killer feature: thinking-time ads (50/50)

Advertisers pay a monthly fee to place a small link + short blurb that appears
**only while the agent is thinking**. Watchers earn for those impressions, split
**50/50** between the platform and the watcher, paid in stablecoin (USDC on Base).
Ads are always toggleable.

The trust anchor already exists in this build: every thinking window mints a
**runtime-signed impression** (`packages/core/src/impression.ts`) that the future
ad ledger will redeem — impressions can be minted only by the runtime, never
spoofed by a client timer. See [docs/specs/thinking-impressions.md](./docs/specs/thinking-impressions.md).

## Quickstart

```bash
pnpm install
pnpm build

# Offline demo (no API key needed):
node packages/cli/dist/index.js run -p mock "hello"

# Real model — copy .env.example to .env and add a key:
cp .env.example .env            # set ANTHROPIC_API_KEY or OPENAI_API_KEY
node packages/cli/dist/index.js run "explain MCP in one sentence"

# Point at any OpenAI-compatible endpoint (OpenRouter, Ollama, local):
ANOMALITHIC_PROVIDER=openai OPENAI_BASE_URL=http://localhost:11434/v1 \
  node packages/cli/dist/index.js run -m llama3.1 "hi"
```

## Workspace layout

| Package | Purpose | License |
|---|---|---|
| `@anomalithic/providers` | Model-agnostic LLM layer (Anthropic, OpenAI-compatible, mock) | OSS |
| `@anomalithic/core` | Agent loop, typed event bus, signed thinking-impressions, tools | OSS |
| `@anomalithic/cli` | The `anomalithic` command-line interface | OSS |

The ads marketplace, payout wallet, and advertiser portal are proprietary
services that build on these open packages. See [LICENSING.md](./LICENSING.md).

## Development

```bash
pnpm build        # build all packages (turbo)
pnpm test         # run all tests (vitest)
pnpm typecheck    # tsc --noEmit across the workspace
pnpm lint         # biome check
```

## License

Open-core. The packages above are Apache-2.0 (see [LICENSE](./LICENSE)); the hosted
ad/payout services are proprietary. Details in [LICENSING.md](./LICENSING.md).
