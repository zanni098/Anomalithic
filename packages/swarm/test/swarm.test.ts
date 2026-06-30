import { EventBus, type Provider, type RuntimeEvent, type StreamEvent } from "@anomalithic/runtime"
import { describe, expect, test } from "vitest"
import { DEFAULT_ROSTER, runSwarm } from "../src/index.js"

/** A scripted provider: consecutive round-trips consume consecutive entries. */
function scripted(rounds: StreamEvent[][]): Provider {
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

describe("runSwarm", () => {
  test("orchestrator delegates to a specialist, then synthesizes a final answer", async () => {
    const events: RuntimeEvent[] = []
    const bus = new EventBus()
    bus.onAny((e) => events.push(e))

    const provider = scripted([
      // Orchestrator turn 1: delegate to Researcher
      [
        {
          type: "tool_call",
          id: "d1",
          name: "delegate",
          arguments: { specialist: "Researcher", task: "find facts" },
        },
        { type: "done", finishReason: "tool_calls" },
      ],
      // Researcher (sub-agent) turn
      [
        { type: "text_delta", text: "Found: water is wet." },
        { type: "done", finishReason: "stop" },
      ],
      // Orchestrator turn 2: final synthesis
      [
        { type: "text_delta", text: "Final: water is wet." },
        { type: "done", finishReason: "stop" },
      ],
    ])

    const result = await runSwarm({
      provider,
      model: "test",
      task: "Is water wet?",
      agents: DEFAULT_ROSTER,
      bus,
    })

    expect(result.text).toBe("Final: water is wet.")
    expect(result.agentsInvoked).toContain("Researcher")
    const types = events.map((e) => e.type)
    expect(types).toContain("delegate")
    expect(types.filter((t) => t === "agent.start").length).toBeGreaterThanOrEqual(2) // orchestrator + Researcher
    const delegate = events.find((e) => e.type === "delegate") as Extract<RuntimeEvent, { type: "delegate" }>
    expect(delegate.to).toBe("Researcher")
  })

  test("runs independent specialists in parallel and combines results", async () => {
    const provider = scripted([
      // Orchestrator: parallel delegate to two specialists
      [
        {
          type: "tool_call",
          id: "p1",
          name: "delegate_parallel",
          arguments: {
            tasks: [
              { specialist: "Researcher", task: "A" },
              { specialist: "Writer", task: "B" },
            ],
          },
        },
        { type: "done", finishReason: "tool_calls" },
      ],
      // Two specialist turns (order may interleave; scripted yields sequentially)
      [
        { type: "text_delta", text: "research done" },
        { type: "done", finishReason: "stop" },
      ],
      [
        { type: "text_delta", text: "writing done" },
        { type: "done", finishReason: "stop" },
      ],
      // Orchestrator final
      [
        { type: "text_delta", text: "all done" },
        { type: "done", finishReason: "stop" },
      ],
    ])

    const result = await runSwarm({ provider, model: "test", task: "do two things", agents: DEFAULT_ROSTER })
    expect(result.text).toBe("all done")
    expect(result.agentsInvoked).toEqual(expect.arrayContaining(["Researcher", "Writer"]))
  })

  test("reports an unknown specialist back to the orchestrator", async () => {
    const provider = scripted([
      [
        { type: "tool_call", id: "d1", name: "delegate", arguments: { specialist: "Nobody", task: "x" } },
        { type: "done", finishReason: "tool_calls" },
      ],
      [
        { type: "text_delta", text: "handled" },
        { type: "done", finishReason: "stop" },
      ],
    ])
    const result = await runSwarm({ provider, model: "test", task: "x", agents: DEFAULT_ROSTER })
    expect(result.text).toBe("handled")
    expect(result.agentsInvoked).not.toContain("Nobody")
  })
})
