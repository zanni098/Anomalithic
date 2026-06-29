import type { Provider, ProviderRequest, StreamEvent } from "@anomalithic/runtime"

/** Splits text into small chunks so the mock streams like a real provider. */
function* chunk(text: string, size = 8): Generator<string> {
  for (let i = 0; i < text.length; i += size) yield text.slice(i, i + size)
}

/**
 * An offline provider that needs no API key. It echoes a canned reply derived from
 * the last user message, emitting a short thinking delta first so the thinking
 * window (and its signed impression) exercises end-to-end. Used for demos and tests.
 */
export function mockProvider(): Provider {
  return {
    id: "mock",
    name: "Mock",
    async models() {
      return ["mock"]
    },
    async *stream(req: ProviderRequest): AsyncIterable<StreamEvent> {
      const lastUser = [...req.messages].reverse().find((m) => m.role === "user")
      const prompt = lastUser?.content ?? ""
      const reply = prompt ? `Mock reply to: ${prompt.slice(0, 120)}` : "Hello from the mock provider."

      yield { type: "thinking_delta", text: "considering the request" }
      for (const c of chunk(reply)) {
        if (req.signal?.aborted) break
        yield { type: "text_delta", text: c }
      }
      yield { type: "usage", inputTokens: prompt.length, outputTokens: reply.length }
      yield { type: "done", finishReason: "stop" }
    },
  }
}
