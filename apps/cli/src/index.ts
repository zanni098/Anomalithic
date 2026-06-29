#!/usr/bin/env node
import { mockProvider } from "@anomalithic/providers"
import { EventBus, type Provider, generateImpressionKey, runAgent } from "@anomalithic/runtime"
import { Command } from "commander"
import { renderTrace } from "./render.js"

/** Provider registry. Real providers (Anthropic/OpenAI/Gemini/free-router/Ollama) land in M1. */
const PROVIDERS: Record<string, () => Provider> = {
  mock: mockProvider,
}

function resolveProvider(id: string): Provider {
  const factory = PROVIDERS[id]
  if (!factory) {
    throw new Error(`Unknown provider: ${id}. Available: ${Object.keys(PROVIDERS).join(", ")}`)
  }
  return factory()
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
  .option("-p, --provider <id>", "provider id", "mock")
  .option("-m, --model <id>", "model id")
  .action(async (promptParts: string[], opts: { provider: string; model?: string }) => {
    const prompt = promptParts.join(" ").trim()
    if (!prompt) {
      console.error("No prompt given. Usage: anomalithic run [prompt...]")
      process.exitCode = 1
      return
    }
    const provider = resolveProvider(opts.provider)
    const bus = new EventBus()
    renderTrace(bus)
    await runAgent({
      provider,
      model: opts.model ?? "mock",
      messages: [{ role: "user", content: prompt }],
      impressionKey: process.env.ANOMALITHIC_IMPRESSION_KEY ?? generateImpressionKey(),
      bus,
    })
  })

program
  .command("models")
  .description("Show available providers")
  .action(() => {
    console.log(`Providers: ${Object.keys(PROVIDERS).join(", ")}`)
  })

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exitCode = 1
})
