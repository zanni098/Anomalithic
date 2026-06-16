import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MockProvider } from "@anomalithic/providers";
import { describe, expect, it } from "vitest";
import { Kernel } from "../src/kernel.js";

describe("Kernel", () => {
  it("composes a working agent with registered tools", async () => {
    const kernel = new Kernel({
      provider: new MockProvider([
        { toolUse: [{ name: "ping", input: {} }] },
        { text: "pong handled" },
      ]),
      model: "mock",
    });
    kernel.registerTool({
      name: "ping",
      description: "returns pong",
      parameters: { type: "object" },
      execute: async () => "pong",
    });

    const result = await kernel.createAgent().run("ping the tool");
    expect(result.turns).toBe(2);
    expect(result.text).toBe("pong handled");
  });

  it("recalls from its memory store", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anomalithic-kernel-"));
    const kernel = new Kernel({ provider: new MockProvider(), model: "mock", memoryDir: dir });
    await kernel.memory?.save({
      name: "providers",
      description: "model backends",
      type: "project",
      created: "2026-06-16",
      body: "anthropic openai ollama openrouter",
      links: [],
    });
    const hits = await kernel.recall("which model backends are supported", 1);
    expect(hits[0]?.name).toBe("providers");
  });
});
