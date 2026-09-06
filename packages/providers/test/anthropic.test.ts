import type { StreamEvent } from "@anomalithic/runtime"
import { afterEach, describe, expect, test, vi } from "vitest"
import { anthropicProvider } from "../src/anthropic.js"

function sseResponse(payloads: unknown[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()
      for (const payload of payloads) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      }
      controller.close()
    },
  })
  return { ok: true, status: 200, body } as Response
}

async function collect(events: AsyncIterable<StreamEvent>): Promise<StreamEvent[]> {
  const result: StreamEvent[] = []
  for await (const event of events) result.push(event)
  return result
}

async function streamEvents(payloads: unknown[]): Promise<StreamEvent[]> {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => sseResponse(payloads)),
  )
  const provider = anthropicProvider({ apiKey: "test", baseUrl: "http://x" })
  return collect(provider.stream({ model: "m", messages: [{ role: "user", content: "x" }] }))
}

afterEach(() => vi.restoreAllMocks())

describe("anthropicProvider finish reasons", () => {
  test("maps max_tokens to length", async () => {
    const events = await streamEvents([
      { type: "message_start", message: { usage: { input_tokens: 4 } } },
      { type: "message_delta", delta: { stop_reason: "max_tokens" }, usage: { output_tokens: 8 } },
      { type: "message_stop" },
    ])

    expect(events.at(-1)).toMatchObject({ type: "done", finishReason: "length" })
  })

  test("keeps end_turn as a normal stop", async () => {
    const events = await streamEvents([
      { type: "message_delta", delta: { stop_reason: "end_turn" } },
      { type: "message_stop" },
    ])

    expect(events.at(-1)).toMatchObject({ type: "done", finishReason: "stop" })
  })

  test("tool use takes precedence over a provider stop reason", async () => {
    const events = await streamEvents([
      {
        type: "content_block_start",
        index: 0,
        content_block: { type: "tool_use", id: "call-1", name: "search" },
      },
      { type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: "{}" } },
      { type: "content_block_stop", index: 0 },
      { type: "message_delta", delta: { stop_reason: "tool_use" } },
      { type: "message_stop" },
    ])

    expect(events.at(-1)).toMatchObject({ type: "done", finishReason: "tool_calls" })
  })
})
