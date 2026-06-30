import { generateImpressionKey } from "@anomalithic/impressions"
import { describe, expect, test } from "vitest"
import { EventBus } from "../src/events.js"
import { runAgent } from "../src/loop.js"
import type { Provider, RuntimeEvent, StreamEvent, Tool } from "../src/types.js"

/** A scripted provider: each entry is the event sequence for one round-trip. */
function scriptedProvider(rounds: StreamEvent[][]): Provider {
  let i = 0
  return {
    id: "scripted",
    name: "Scripted",
    async *stream() {
      const round = rounds[i++] ?? [{ type: "done", finishReason: "stop" }]
      for (const ev of round) yield ev
    },
  }
}

const echoTool: Tool = {
  name: "echo",
  description: "Echoes its input back.",
  parameters: { type: "object", properties: { value: { type: "string" } }, required: ["value"] },
  async execute(args) {
    return { output: `echo:${String(args.value)}` }
  },
}

describe("runAgent", () => {
  test("streams text and completes in one turn", async () => {
    const events: RuntimeEvent[] = []
    const bus = new EventBus()
    bus.onAny((e) => events.push(e))

    const result = await runAgent({
      provider: scriptedProvider([
        [
          { type: "thinking_delta", text: "hmm" },
          { type: "text_delta", text: "Hello" },
          { type: "text_delta", text: " world" },
          { type: "done", finishReason: "stop" },
        ],
      ]),
      model: "test",
      messages: [{ role: "user", content: "hi" }],
      impressionKey: generateImpressionKey(),
      bus,
    })

    expect(result.text).toBe("Hello world")
    expect(result.turns).toBe(1)
    expect(result.impressions).toHaveLength(1)
    const types = events.map((e) => e.type)
    expect(types).toContain("thinking.start")
    expect(types).toContain("thinking.end")
    expect(types).toContain("done")
    // thinking must close before the first text event
    expect(types.indexOf("thinking.end")).toBeLessThan(types.indexOf("text"))
  })

  test("executes a tool call then finishes on the next turn", async () => {
    const result = await runAgent({
      provider: scriptedProvider([
        [
          { type: "tool_call", id: "c1", name: "echo", arguments: { value: "ping" } },
          { type: "done", finishReason: "tool_calls" },
        ],
        [
          { type: "text_delta", text: "done: echo:ping" },
          { type: "done", finishReason: "stop" },
        ],
      ]),
      model: "test",
      messages: [{ role: "user", content: "use echo" }],
      tools: [echoTool],
      impressionKey: generateImpressionKey(),
    })

    expect(result.turns).toBe(2)
    expect(result.impressions).toHaveLength(2)
    const toolMsg = result.messages.find((m) => m.role === "tool")
    expect(toolMsg?.content).toBe("echo:ping")
    expect(result.text).toBe("done: echo:ping")
  })

  test("reports an unknown tool back to the model instead of throwing", async () => {
    const result = await runAgent({
      provider: scriptedProvider([
        [
          { type: "tool_call", id: "c1", name: "nope", arguments: {} },
          { type: "done", finishReason: "tool_calls" },
        ],
        [
          { type: "text_delta", text: "ok" },
          { type: "done", finishReason: "stop" },
        ],
      ]),
      model: "test",
      messages: [{ role: "user", content: "x" }],
      tools: [echoTool],
    })
    const toolMsg = result.messages.find((m) => m.role === "tool")
    expect(toolMsg?.content).toContain("Unknown tool: nope")
  })
})
