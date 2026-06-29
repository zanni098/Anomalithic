#!/usr/bin/env node
import {
  DEFAULT_MODELS,
  type ProviderId,
  buildProvider,
  resolveDefaultProviderId,
} from "@anomalithic/providers"
import { EventBus, generateImpressionKey, runAgent } from "@anomalithic/runtime"
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
