import { ImpressionSigner, type ThinkingImpression } from "@anomalithic/impressions"
import { EventBus } from "./events.js"
import type { Message, Provider, Tool, ToolCall } from "./types.js"

export interface RunAgentOptions {
  provider: Provider
  model: string
  /** Conversation so far. The loop appends assistant + tool messages to a copy. */
  messages: Message[]
  tools?: Tool[]
  sessionId?: string
  /** HMAC key used to mint signed thinking-impressions. */
  impressionKey?: string
  bus?: EventBus
  signal?: AbortSignal
  temperature?: number
  /** Hard cap on provider round-trips before the loop returns. */
  maxTurns?: number
}

export interface RunAgentResult {
  /** Final assistant text. */
  text: string
  /** Full transcript including appended assistant/tool messages. */
  messages: Message[]
  /** Signed proof of each thinking window entered. */
  impressions: ThinkingImpression[]
  turns: number
}

const DEFAULT_MAX_TURNS = 16

/**
 * The provider-agnostic agent loop: gather → think → act → observe → repeat.
 *
 * The *agent* (not the provider) defines the thinking window so the impression
 * feature works on any model: it opens at the start of each round-trip and closes
 * at the first output token or tool call. Each window mints one signed impression.
 */
export async function runAgent(opts: RunAgentOptions): Promise<RunAgentResult> {
  const bus = opts.bus ?? new EventBus()
  const sessionId = opts.sessionId ?? "default"
  const tools = opts.tools ?? []
  const toolByName = new Map(tools.map((t) => [t.name, t]))
  const maxTurns = opts.maxTurns ?? DEFAULT_MAX_TURNS
  const signer = opts.impressionKey ? new ImpressionSigner(opts.impressionKey, sessionId) : undefined

  const messages: Message[] = [...opts.messages]
  const impressions: ThinkingImpression[] = []
  let finalText = ""
  let turn = 0

  while (turn < maxTurns) {
    if (opts.signal?.aborted) break
    bus.emit({ type: "turn.start", turn })

    // Open the thinking window.
    const impression = signer?.mint(turn, Date.now())
    if (impression) {
      impressions.push(impression)
      bus.emit({ type: "thinking.start", turn, impression })
    }
    let thinkingOpen = true
    const closeThinking = () => {
      if (thinkingOpen) {
        thinkingOpen = false
        bus.emit({ type: "thinking.end", turn })
      }
    }

    let text = ""
    const calls: ToolCall[] = []
    let finishReason: "stop" | "tool_calls" | "length" | "error" = "stop"

    try {
      for await (const ev of opts.provider.stream({
        model: opts.model,
        messages,
        tools: tools.map((t) => ({ name: t.name, description: t.description, parameters: t.parameters })),
        temperature: opts.temperature,
        signal: opts.signal,
      })) {
        switch (ev.type) {
          case "thinking_delta":
            if (thinkingOpen) bus.emit({ type: "thinking.delta", turn, text: ev.text })
            break
          case "text_delta":
            closeThinking()
            text += ev.text
            bus.emit({ type: "text", text: ev.text })
            break
          case "tool_call":
            closeThinking()
            calls.push({ id: ev.id, name: ev.name, arguments: ev.arguments })
            bus.emit({ type: "tool.call", id: ev.id, name: ev.name, arguments: ev.arguments })
            break
          case "usage":
            bus.emit({ type: "usage", inputTokens: ev.inputTokens, outputTokens: ev.outputTokens })
            break
          case "done":
            finishReason = ev.finishReason
            break
          case "error":
            closeThinking()
            bus.emit({ type: "error", error: ev.error })
            throw new Error(ev.error)
        }
      }
    } finally {
      closeThinking()
    }

    messages.push({
      role: "assistant",
      content: text,
      ...(calls.length ? { toolCalls: calls } : {}),
    })

    if (calls.length === 0) {
      finalText = text
      bus.emit({ type: "turn.end", turn })
      bus.emit({ type: "done", text: finalText })
      return { text: finalText, messages, impressions, turns: turn + 1 }
    }

    // Execute tool calls, append results, and iterate.
    for (const call of calls) {
      const tool = toolByName.get(call.name)
      let output: string
      let isError = false
      if (!tool) {
        output = `Unknown tool: ${call.name}`
        isError = true
      } else {
        try {
          const result = await tool.execute(call.arguments, {
            sessionId,
            signal: opts.signal,
            emit: (e) => bus.emit(e),
          })
          output = result.output
        } catch (err) {
          output = `Tool ${call.name} failed: ${err instanceof Error ? err.message : String(err)}`
          isError = true
        }
      }
      bus.emit({ type: "tool.result", id: call.id, name: call.name, output, isError })
      messages.push({ role: "tool", content: output, toolCallId: call.id, name: call.name })
    }

    bus.emit({ type: "turn.end", turn })
    turn++
  }

  // Loop exhausted (max turns or aborted): return whatever we have.
  bus.emit({ type: "done", text: finalText })
  return { text: finalText, messages, impressions, turns: turn }
}
