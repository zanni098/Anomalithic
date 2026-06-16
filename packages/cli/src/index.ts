#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { Agent, type SessionState, SessionStore } from "@anomalithic/core";
import { type Message, createProvider } from "@anomalithic/providers";
import { Command } from "commander";
import { config as loadDotenv } from "dotenv";
import { attachAds } from "./ads.js";
import { mcpCommand, memoryCommand, pluginsCommand, skillsCommand } from "./commands.js";
import { type CliOverrides, apiKeyEnvVar, loadConfig } from "./config.js";

loadDotenv();

const VERSION = "0.1.0";
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

  // Only persist a session when one is explicitly requested, so one-shot runs
  // don't accumulate random session files.
  const persist = Boolean(overrides.session || overrides.resume);
  const store = new SessionStore(join(process.cwd(), ".anomalithic", "sessions"));
  let resolvedId = overrides.session;
  if (overrides.resume && !resolvedId) resolvedId = store.list()[0]?.id;
  const prior = persist && resolvedId ? store.load(resolvedId) : undefined;
  const sid = resolvedId ?? randomUUID();
  const createdAt = prior?.createdAt ?? new Date().toISOString();

  const provider = createProvider({ kind: cfg.kind, apiKey: cfg.apiKey, baseUrl: cfg.baseUrl });
  const userMsg: Message = { role: "user", content: [{ type: "text", text: prompt }] };
  const input: string | Message[] =
    prior && prior.messages.length > 0 ? [...prior.messages, userMsg] : prompt;

  const agent = new Agent({
    provider,
    model: cfg.model,
    sessionId: sid,
    onTurnEnd: persist
      ? (snap) => {
          const state: SessionState = {
            id: sid,
            model: cfg.model,
            messages: snap.messages,
            impressions: snap.impressions,
            turns: snap.turn,
            createdAt,
            updatedAt: new Date().toISOString(),
          };
          store.save(state);
        }
      : undefined,
  });
  attachAds(agent.bus, { enabled: cfg.ads });

  agent.bus.on("thinking.start", () => process.stderr.write(dim("✦ thinking…\n")));
  agent.bus.on("text", (e) => process.stdout.write(e.text));

  try {
    const result = await agent.run(input);
    process.stdout.write("\n");
    process.stderr.write(
      dim(
        `\n[${cfg.kind}:${cfg.model}] ${result.turns} turn(s), ` +
          `${result.usage.inputTokens}+${result.usage.outputTokens} tokens, ` +
          `${result.impressions.length} impression(s)${persist ? ` · session ${sid.slice(0, 8)}` : ""}\n`,
      ),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\nError: ${message}`);
    process.exitCode = 1;
  }
}

async function interactiveChat(overrides: CliOverrides): Promise<void> {
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
  const store = new SessionStore(join(process.cwd(), ".anomalithic", "sessions"));
  let resolvedId = overrides.session;
  if (overrides.resume && !resolvedId) resolvedId = store.list()[0]?.id;
  const prior = resolvedId ? store.load(resolvedId) : undefined;
  const sid = resolvedId ?? randomUUID();
  const createdAt = prior?.createdAt ?? new Date().toISOString();
  let history: Message[] = prior?.messages ?? [];

  console.error(
    dim(
      `Anomalithic chat — ${cfg.kind}:${cfg.model} · session ${sid.slice(0, 8)} · type /exit to quit`,
    ),
  );
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const ask = () => {
    rl.question("\n› ", async (line) => {
      const text = line.trim();
      if (text === "/exit" || text === "/quit") {
        rl.close();
        return;
      }
      if (!text) {
        ask();
        return;
      }
      history = [...history, { role: "user", content: [{ type: "text", text }] }];
      const agent = new Agent({
        provider,
        model: cfg.model,
        sessionId: sid,
        onTurnEnd: (snap) => {
          history = snap.messages;
          store.save({
            id: sid,
            model: cfg.model,
            messages: snap.messages,
            impressions: snap.impressions,
            turns: snap.turn,
            createdAt,
            updatedAt: new Date().toISOString(),
          });
        },
      });
      if (cfg.ads) {
        agent.bus.on("thinking.start", () =>
          process.stdout.write(dim("💡 anomalithic.vercel.app/earn\n")),
        );
      }
      agent.bus.on("thinking.start", () => process.stdout.write(dim("✦ thinking…\n")));
      agent.bus.on("text", (e) => process.stdout.write(e.text));
      try {
        await agent.run(history);
        process.stdout.write("\n");
      } catch (err) {
        console.error(`\nError: ${err instanceof Error ? err.message : String(err)}`);
      }
      ask();
    });
  };
  ask();
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
  .option("-s, --session <id>", "continue a named session")
  .option("--resume", "resume the most recent session")
  .action((promptParts: string[], opts: CliOverrides) => {
    if (!promptParts || promptParts.length === 0) {
      program.help();
      return undefined;
    }
    return executePrompt(promptParts, opts);
  });

program
  .command("chat")
  .description("Interactive multi-turn session (streaming, session-backed)")
  .option("-p, --provider <kind>", "provider: anthropic | openai | mock")
  .option("-m, --model <model>", "model id")
  .option("--ads", "show thinking-time ads")
  .option("-s, --session <id>", "continue a named session")
  .option("--resume", "resume the most recent session")
  .action((opts: CliOverrides) => interactiveChat(opts));

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

program
  .command("skills")
  .description("Discover Claude SKILL.md and Codex AGENTS.md skills")
  .argument("[dirs...]", "directories to search (defaults to the current directory)")
  .action((dirs: string[]) => skillsCommand(dirs ?? []));

program
  .command("memory")
  .description("Cross-session memory: list, or recall <query>")
  .argument("<action>", "list | recall")
  .argument("[query...]", "query text for recall")
  .action((action: string, query: string[]) => memoryCommand(action, query ?? []));

program
  .command("plugins")
  .description("Discover installed plugins (skills + MCP servers + hooks)")
  .argument("[dirs...]", "directories to search (defaults to .anomalithic/plugins)")
  .action((dirs: string[]) => pluginsCommand(dirs ?? []));

program
  .command("mcp")
  .description("Connect to an MCP stdio server and list its tools")
  .argument("<command>", "the MCP server command to spawn")
  .argument("[args...]", "arguments passed to the server")
  .action((command: string, args: string[]) => mcpCommand(command, args ?? []));

program
  .command("sessions")
  .description("List saved, resumable sessions")
  .action(() => {
    const store = new SessionStore(join(process.cwd(), ".anomalithic", "sessions"));
    const list = store.list();
    if (list.length === 0) {
      console.log("No saved sessions. Run with --session <id> to start one.");
      return;
    }
    for (const s of list) {
      console.log(`${s.id.slice(0, 8)}  ${s.turns} turn(s)  ${dim(s.updatedAt)}`);
    }
  });

program.parseAsync(process.argv);
