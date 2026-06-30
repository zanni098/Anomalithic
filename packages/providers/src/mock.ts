import type { Message, Provider, ProviderRequest, StreamEvent, ToolSchema } from "@anomalithic/runtime"

/** Splits text into small chunks so the mock streams like a real provider. */
function* chunk(text: string, size = 8): Generator<string> {
  for (let i = 0; i < text.length; i += size) yield text.slice(i, i + size)
}

function lastUserContent(messages: Message[]): string {
  return [...messages].reverse().find((m) => m.role === "user")?.content ?? ""
}

/** Reads the specialist names a `delegate` tool offers, if present. */
function delegateSpecialists(tools?: ToolSchema[]): string[] {
  const delegate = tools?.find((t) => t.name === "delegate")
  const props = (delegate?.parameters as any)?.properties?.specialist?.enum
  return Array.isArray(props) ? (props as string[]) : []
}

/**
 * An offline provider that needs no API key. It echoes a canned reply, emitting a
 * short thinking delta first so the thinking window (and its signed impression)
 * exercises end-to-end.
 *
 * It is also **swarm-aware for demos**: when handed a `delegate` tool (i.e. it is
 * acting as the Orchestrator), it delegates once to the first specialist and then,
 * after the result returns, synthesizes a final answer — so the whole `runSwarm`
 * engine, CLI, and trace renderer can be demonstrated with zero credits.
 */
export function mockProvider(): Provider {
  return {
    id: "mock",
    name: "Mock",
    async models() {
      return ["mock"]
    },
    async *stream(req: ProviderRequest): AsyncIterable<StreamEvent> {
      const specialists = delegateSpecialists(req.tools)
      const alreadyDelegated = req.messages.some(
        (m) => m.role === "assistant" && (m.toolCalls?.length ?? 0) > 0,
      )
      const prompt = lastUserContent(req.messages)

      // Orchestrator's first turn: delegate to a specialist.
      if (specialists.length > 0 && !alreadyDelegated) {
        const specialist = specialists[0] as string
        yield { type: "thinking_delta", text: `planning: route to ${specialist}` }
        yield {
          type: "tool_call",
          id: "mock-delegate-1",
          name: "delegate",
          arguments: { specialist, task: prompt || "Handle the user's request." },
        }
        yield { type: "done", finishReason: "tool_calls" }
        return
      }

      const reply =
        specialists.length > 0
          ? "Synthesis: the specialist completed the task; here is the combined result."
          : prompt
            ? `Mock reply to: ${prompt.slice(0, 120)}`
            : "Hello from the mock provider."

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
