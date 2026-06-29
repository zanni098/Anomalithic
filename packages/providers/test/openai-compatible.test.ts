import type { StreamEvent } from "@anomalithic/runtime"
import { afterEach, describe, expect, test, vi } from "vitest"
import { openAICompatibleProvider } from "../src/openai-compatible.js"

/** Builds a fake fetch Response whose body streams the given SSE `data:` payloads. */
function sseResponse(payloads: string[], ok = true, status = 200): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder()
      for (const p of payloads) controller.enqueue(enc.encode(`data: ${p}\n\n`))
      controller.enqueue(enc.encode("data: [DONE]\n\n"))
      controller.close()
    },
  })
  return {
    ok,
    status,
    body,
    async text() {
      return "err"
    },
  } as unknown as Response
}

async function collect(it: AsyncIterable<StreamEvent>): Promise<StreamEvent[]> {
  const out: StreamEvent[] = []
  for await (const e of it) out.push(e)
  return out
}

afterEach(() => vi.restoreAllMocks())

describe("openAICompatibleProvider", () => {
  test("streams reasoning, text, and usage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseResponse([
          JSON.stringify({ choices: [{ delta: { reasoning: "let me think" } }] }),
          JSON.stringify({ choices: [{ delta: { content: "Hello " } }] }),
          JSON.stringify({ choices: [{ delta: { content: "world" } }] }),
          JSON.stringify({ choices: [{ finish_reason: "stop", delta: {} }] }),
          JSON.stringify({ usage: { prompt_tokens: 5, completion_tokens: 2 } }),
        ]),
      ),
    )
    const p = openAICompatibleProvider({ id: "t", name: "T", baseUrl: "http://x/v1", apiKey: "k" })
    const events = await collect(p.stream({ model: "m", messages: [{ role: "user", content: "hi" }] }))
    const text = events
      .filter((e) => e.type === "text_delta")
      .map((e) => (e as any).text)
      .join("")
    expect(text).toBe("Hello world")
    expect(events.some((e) => e.type === "thinking_delta")).toBe(true)
    expect(events.find((e) => e.type === "usage")).toMatchObject({ inputTokens: 5, outputTokens: 2 })
    expect(events.at(-1)).toMatchObject({ type: "done", finishReason: "stop" })
  })

  test("reassembles a tool call from fragmented deltas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseResponse([
          JSON.stringify({
            choices: [{ delta: { tool_calls: [{ index: 0, id: "c1", function: { name: "search" } }] } }],
          }),
          JSON.stringify({
            choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '{"q":"a' } }] } }],
          }),
          JSON.stringify({
            choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'i"}' } }] } }],
          }),
          JSON.stringify({ choices: [{ finish_reason: "tool_calls", delta: {} }] }),
        ]),
      ),
    )
    const p = openAICompatibleProvider({ id: "t", name: "T", baseUrl: "http://x/v1" })
    const events = await collect(p.stream({ model: "m", messages: [{ role: "user", content: "x" }] }))
    const call = events.find((e) => e.type === "tool_call") as any
    expect(call).toMatchObject({ name: "search", id: "c1", arguments: { q: "ai" } })
    expect(events.at(-1)).toMatchObject({ type: "done", finishReason: "tool_calls" })
  })

  test("emits an error event on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => sseResponse([], false, 401)),
    )
    const p = openAICompatibleProvider({ id: "t", name: "T", baseUrl: "http://x/v1" })
    const events = await collect(p.stream({ model: "m", messages: [] }))
    expect(events[0]).toMatchObject({ type: "error" })
  })
})
