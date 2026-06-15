import { describe, expect, it } from "vitest";
import { collect } from "../src/collect.js";
import { MockProvider } from "../src/mock.js";
import type { StreamEvent } from "../src/types.js";

const opts = {
  model: "mock",
  messages: [{ role: "user" as const, content: [{ type: "text" as const, text: "hi" }] }],
};

describe("MockProvider", () => {
  it("streams thinking events before text", async () => {
    const provider = new MockProvider([{ thinking: "hmm", text: "world" }]);
    const events: StreamEvent[] = [];
    for await (const e of provider.stream(opts)) events.push(e);

    const types = events.map((e) => e.type);
    expect(types[0]).toBe("thinking_start");
    expect(types).toContain("thinking_delta");
    expect(types).toContain("thinking_end");
    expect(types.indexOf("thinking_end")).toBeLessThan(types.indexOf("text_delta"));
    expect(types.at(-1)).toBe("done");
  });

  it("collects a streamed turn into a single text message", async () => {
    const provider = new MockProvider([{ text: "hello world" }]);
    const result = await provider.generate(opts);
    expect(result.stopReason).toBe("end_turn");
    expect(result.message.content).toEqual([{ type: "text", text: "hello world" }]);
  });

  it("emits tool_use and reports stopReason tool_use", async () => {
    const provider = new MockProvider([{ toolUse: [{ name: "echo", input: { v: 1 } }] }]);
    const result = await collect(provider.stream(opts));
    expect(result.stopReason).toBe("tool_use");
    expect(result.message.content[0]).toMatchObject({ type: "tool_use", name: "echo" });
  });

  it("advances through scripted turns and repeats the last", async () => {
    const provider = new MockProvider([{ text: "first" }, { text: "second" }]);
    expect((await provider.generate(opts)).message.content).toEqual([
      { type: "text", text: "first" },
    ]);
    expect((await provider.generate(opts)).message.content).toEqual([
      { type: "text", text: "second" },
    ]);
    expect((await provider.generate(opts)).message.content).toEqual([
      { type: "text", text: "second" },
    ]);
  });
});
