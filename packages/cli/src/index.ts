#!/usr/bin/env node
import { Agent } from "@anomalithic/core";
import { createProvider } from "@anomalithic/providers";
import { Command } from "commander";
import { config as loadDotenv } from "dotenv";
import { attachAds } from "./ads.js";
import { type CliOverrides, apiKeyEnvVar, loadConfig } from "./config.js";

loadDotenv();

const VERSION = "0.0.0";
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

async function executePrompt(promptParts: string[], overrides: CliOverrides): Promise<void> {
  const prompt = promptParts.join(" ").trim();
  if (!prompt) {
    console.error('No prompt provided. Try: anomalithic run "hello"');
    process.exitCode = 1;
    return;
  }

  const cfg = loadConfig(overrides);
  const keyVar = apiKeyEnvVar(cfg.kind);
  if (keyVar && !cfg.apiKey) {
    console.error(
      `Missing API key for provider "${cfg.kind}". Set ${keyVar} (copy .env.example to .env).`,
    );
    process.exitCode = 1;
    return;
  }

  const provider = createProvider({ kind: cfg.kind, apiKey: cfg.apiKey, baseUrl: cfg.baseUrl });
  const agent = new Agent({ provider, model: cfg.model });
  attachAds(agent.bus, { enabled: cfg.ads });

  agent.bus.on("thinking.start", () => process.stderr.write(dim("✦ thinking…\n")));
  agent.bus.on("text", (e) => process.stdout.write(e.text));

  try {
    const result = await agent.run(prompt);
    process.stdout.write("\n");
    process.stderr.write(
      dim(
        `\n[${cfg.kind}:${cfg.model}] ${result.turns} turn(s), ` +
          `${result.usage.inputTokens}+${result.usage.outputTokens} tokens, ` +
          `${result.impressions.length} impression(s)\n`,
      ),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\nError: ${message}`);
    process.exitCode = 1;
  }
}

const program = new Command();
program
  .name("anomalithic")
  .description("Anomalithic — one model-agnostic agent runtime to rule them all.")
  .version(VERSION);

// `run` is the default command, so both `anomalithic run "hi"` and the shorthand
// `anomalithic "hi"` route here without ambiguous option parsing.
program
  .command("run", { isDefault: true })
  .description("Send a one-shot prompt to the agent")
  .argument("[prompt...]", "the prompt text")
  .option("-p, --provider <kind>", "provider: anthropic | openai | mock")
  .option("-m, --model <model>", "model id")
  .option("--ads", "enable thinking-time ads (placeholder in this build)")
  .action((promptParts: string[], opts: CliOverrides) => {
    if (!promptParts || promptParts.length === 0) {
      program.help();
      return undefined;
    }
    return executePrompt(promptParts, opts);
  });

program
  .command("models")
  .description("Show the configured provider and model")
  .action(() => {
    const cfg = loadConfig();
    console.log(`provider: ${cfg.kind}`);
    console.log(`model:    ${cfg.model}`);
    if (cfg.baseUrl) console.log(`baseUrl:  ${cfg.baseUrl}`);
    console.log(`ads:      ${cfg.ads ? "on" : "off"}`);
  });

program.parseAsync(process.argv);
