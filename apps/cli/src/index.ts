#!/usr/bin/env node
import {
  DEFAULT_MODELS,
  type ProviderId,
  buildProvider,
  resolveDefaultProviderId,
} from "@anomalithic/providers"
import { EventBus, type Tool, generateImpressionKey, runAgent } from "@anomalithic/runtime"
import { type AgentDefinition, DEFAULT_ROSTER, runSwarm } from "@anomalithic/swarm"
import { builtinTools } from "@anomalithic/tools"
import { Command } from "commander"
import { loadDotenv } from "./env.js"
import { renderTrace } from "./render.js"

loadDotenv()

const PROVIDER_IDS: ProviderId[] = [
  "mock",
  "free-router",
  "openrouter",
  "openai",
  "gemini",
  "ollama",
  "anthropic",
]

/** Resolves the model to use: explicit `-m`, else the provider default. The Free
 * Models Router keeps the "auto" sentinel so it can route across free models itself. */
function resolveModel(
  id: ProviderId,
  explicit: string | undefined,
): { provider: ReturnType<typeof buildProvider>; model: string } {
  const provider = buildProvider(id)
  return { provider, model: explicit ?? DEFAULT_MODELS[id] }
}

const program = new Command()
program
  .name("anomalithic")
  .description("Anomalithic — one open-core, model-agnostic multi-agent runtime to rule them all.")
  .version("0.1.0")

program
  .command("run")
  .description("Send a one-shot prompt to the agent")
  .argument("[prompt...]", "the prompt")
  .option("-p, --provider <id>", "provider id (default: resolved from env)")
  .option("-m, --model <id>", "model id")
  .action(async (promptParts: string[], opts: { provider?: string; model?: string }) => {
    const prompt = promptParts.join(" ").trim()
    if (!prompt) {
      console.error("No prompt given. Usage: anomalithic run [prompt...]")
      process.exitCode = 1
      return
    }
    const id = (opts.provider ?? resolveDefaultProviderId()) as ProviderId
    if (!PROVIDER_IDS.includes(id)) {
      console.error(`Unknown provider: ${id}. Available: ${PROVIDER_IDS.join(", ")}`)
      process.exitCode = 1
      return
    }
    const { provider, model } = resolveModel(id, opts.model)
    const bus = new EventBus()
    renderTrace(bus)
    process.stdout.write(`\x1b[2m[${provider.name} · ${model}]\x1b[0m\n`)
    await runAgent({
      provider,
      model,
      messages: [{ role: "user", content: prompt }],
      impressionKey: process.env.ANOMALITHIC_IMPRESSION_KEY ?? generateImpressionKey(),
      bus,
    })
  })

program
  .command("swarm")
  .description("Run the multi-agent swarm: an Orchestrator delegates to specialists")
  .argument("[goal...]", "the goal for the swarm")
  .option("-p, --provider <id>", "provider id (default: resolved from env)")
  .option("-m, --model <id>", "model id")
  .option("-w, --workspace <dir>", "workspace root for file/shell tools", process.cwd())
  .action(async (goalParts: string[], opts: { provider?: string; model?: string; workspace: string }) => {
    const goal = goalParts.join(" ").trim()
    if (!goal) {
      console.error("No goal given. Usage: anomalithic swarm [goal...]")
      process.exitCode = 1
      return
    }
    const id = (opts.provider ?? resolveDefaultProviderId()) as ProviderId
    if (!PROVIDER_IDS.includes(id)) {
      console.error(`Unknown provider: ${id}. Available: ${PROVIDER_IDS.join(", ")}`)
      process.exitCode = 1
      return
    }
    const { provider, model } = resolveModel(id, opts.model)
    const allTools = builtinTools({ workspaceRoot: opts.workspace, web: true, shell: true })
    const toolsFor = (agent: AgentDefinition): Tool[] =>
      agent.toolNames ? allTools.filter((t) => agent.toolNames?.includes(t.name)) : []

    const bus = new EventBus()
    renderTrace(bus)
    process.stdout.write(`\x1b[2m[swarm · ${provider.name} · ${model}]\x1b[0m\n`)
    const result = await runSwarm({
      provider,
      model,
      task: goal,
      agents: DEFAULT_ROSTER,
      toolsFor,
      impressionKey: process.env.ANOMALITHIC_IMPRESSION_KEY ?? generateImpressionKey(),
      bus,
    })
    process.stdout.write(`\n\x1b[2m— agents: ${result.agentsInvoked.join(", ") || "none"} —\x1b[0m\n`)
  })

program
  .command("models")
  .description("Show available providers and the resolved default")
  .action(() => {
    const def = resolveDefaultProviderId()
    console.log(`Providers: ${PROVIDER_IDS.join(", ")}`)
    console.log(`Default (from env): ${def} · ${DEFAULT_MODELS[def]}`)
  })

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exitCode = 1
})
