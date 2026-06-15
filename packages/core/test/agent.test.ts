import { MockProvider } from "@anomalithic/providers";
import { describe, expect, it } from "vitest";
import { Agent } from "../src/agent.js";
import { verifyImpression } from "../src/impression.js";
import { ToolRegistry } from "../src/tools.js";

describe("Agent", () => {
  it("answers a single turn and emits a verifiable thinking impression", async () => {
    const key = "test-key";
    const agent = new Agent({
      provider: new MockProvider([{ thinking: "ponder", text: "the answer is 42" }]),
      model: "mock",
      impressionKey: key,
    });

    const events: string[] = [];
    agent.bus.on("thinking.start", () => events.push("start"));
    agent.bus.on("thinking.end", () => events.push("end"));

    const result = await agent.run("what is the answer?");

    expect(result.text).toBe("the answer is 42");
    expect(result.turns).toBe(1);
    expect(events).toEqual(["start", "end"]);
    expect(result.impressions).toHaveLength(1);
    const impression = result.impressions[0];
    if (!impression) throw new Error("expected a thinking impression");
    expect(verifyImpression(key, impression)).toBe(true);
    expect(verifyImpression("wrong-key", impression)).toBe(false);
  });

  it("runs a tool then produces a final answer", async () => {
    const tools = new ToolRegistry().register({
      name: "add",
      description: "Add two numbers",
      parameters: {
        type: "object",
        properties: { a: { type: "number" }, b: { type: "number" } },
        required: ["a", "b"],
      },
      async execute(input) {
        const { a, b } = input as { a: number; b: number };
        return String(a + b);
      },
    });

    const agent = new Agent({
      provider: new MockProvider([
        { thinking: "need to add", toolUse: [{ name: "add", input: { a: 2, b: 3 } }] },
        { text: "The sum is 5." },
      ]),
      model: "mock",
      tools,
    });

    const toolResults: string[] = [];
    agent.bus.on("tool.result", (e) => toolResults.push(e.output));

    const result = await agent.run("add 2 and 3");

    expect(result.turns).toBe(2);
    expect(toolResults).toEqual(["5"]);
    expect(result.text).toBe("The sum is 5.");
    expect(result.impressions).toHaveLength(2);
  });
});
