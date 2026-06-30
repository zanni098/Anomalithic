import { generateImpressionKey, runAgent } from "@anomalithic/runtime"
import { describe, expect, test } from "vitest"
import { mockProvider } from "../src/mock.js"

describe("mockProvider", () => {
  test("drives a full agent turn with a signed impression", async () => {
    const result = await runAgent({
      provider: mockProvider(),
      model: "mock",
      messages: [{ role: "user", content: "hello there" }],
      impressionKey: generateImpressionKey(),
    })
    expect(result.text).toContain("Mock reply to: hello there")
    expect(result.turns).toBe(1)
    expect(result.impressions).toHaveLength(1)
  })

  test("emits thinking, text, usage, and done events", async () => {
    const events: string[] = []
    const provider = mockProvider()
    for await (const ev of provider.stream({ model: "mock", messages: [{ role: "user", content: "x" }] })) {
      events.push(ev.type)
    }
    expect(events).toContain("thinking_delta")
    expect(events).toContain("text_delta")
    expect(events).toContain("usage")
    expect(events.at(-1)).toBe("done")
  })
})
