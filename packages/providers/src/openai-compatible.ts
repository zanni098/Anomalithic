import type { Message, Provider, ProviderRequest, StreamEvent, ToolSchema } from "@anomalithic/runtime"
import { readSSE } from "./sse.js"

export interface OpenAICompatibleOptions {
  id: string
  name: string
  baseUrl: string
  apiKey?: string
  /** Extra headers (e.g. OpenRouter attribution). */
  headers?: Record<string, string>
  /** Override the model listing endpoint result. */
  staticModels?: string[]
}

type FinishReason = "stop" | "tool_calls" | "length" | "error"

interface OpenAIToolCallFragment {
  index: number
  id?: string
  function?: { name?: string; arguments?: string }
}

/** Maps our internal messages onto the OpenAI chat-completions shape. */
function toOpenAIMessages(messages: Message[]): unknown[] {
  return messages.map((m) => {
    if (m.role === "assistant" && m.toolCalls?.length) {
      return {
        role: "assistant",
        content: m.content || null,
        tool_calls: m.toolCalls.map((c) => ({
          id: c.id,
          type: "function",
          function: { name: c.name, arguments: JSON.stringify(c.arguments ?? {}) },
        })),
      }
    }
    if (m.role === "tool") {
      return { role: "tool", tool_call_id: m.toolCallId, content: m.content }
    }
    return { role: m.role, content: m.content }
  })
}

function toOpenAITools(tools?: ToolSchema[]): unknown[] | undefined {
  if (!tools?.length) return undefined
  return tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }))
}

function safeParseArgs(raw: string): Record<string, unknown> {
  if (!raw.trim()) return {}
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function authHeaders(opts: OpenAICompatibleOptions): Record<string, string> {
  return {
    ...(opts.apiKey ? { authorization: `Bearer ${opts.apiKey}` } : {}),
    ...opts.headers,
  }
}

/**
 * A provider for any OpenAI-compatible `/chat/completions` endpoint: OpenRouter
 * (incl. the Free Models Router), OpenAI, Google Gemini's compat endpoint, Ollama,
 * or any local server. Streams text, reasoning (as thinking), and tool calls.
 */
export function openAICompatibleProvider(opts: OpenAICompatibleOptions): Provider {
  return {
    id: opts.id,
    name: opts.name,
    async models() {
      if (opts.staticModels) return opts.staticModels
      try {
        const res = await fetch(`${opts.baseUrl}/models`, { headers: authHeaders(opts) })
        if (!res.ok) return []
        const json = (await res.json()) as { data?: { id: string }[] }
        return (json.data ?? []).map((m) => m.id)
      } catch {
        return []
      }
    },
    async *stream(req: ProviderRequest): AsyncIterable<StreamEvent> {
      let res: Response
      try {
        res = await fetch(`${opts.baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json", ...authHeaders(opts) },
          body: JSON.stringify({
            model: req.model,
            messages: toOpenAIMessages(req.messages),
            tools: toOpenAITools(req.tools),
            temperature: req.temperature,
            stream: true,
            stream_options: { include_usage: true },
          }),
          signal: req.signal,
        })
      } catch (err) {
        yield { type: "error", error: `network error: ${err instanceof Error ? err.message : String(err)}` }
        return
      }

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => "")
        yield { type: "error", error: `${opts.name} ${res.status}: ${detail.slice(0, 300)}` }
        return
      }

      const toolFrags = new Map<number, { id: string; name: string; args: string }>()
      let finishReason: FinishReason = "stop"

      for await (const data of readSSE(res.body)) {
        let chunk: any
        try {
          chunk = JSON.parse(data)
        } catch {
          continue
        }
        const choice = chunk.choices?.[0]
        const delta = choice?.delta
        if (delta) {
          const reasoning = delta.reasoning ?? delta.reasoning_content
          if (typeof reasoning === "string" && reasoning) yield { type: "thinking_delta", text: reasoning }
          if (typeof delta.content === "string" && delta.content)
            yield { type: "text_delta", text: delta.content }
          for (const frag of (delta.tool_calls ?? []) as OpenAIToolCallFragment[]) {
            const cur = toolFrags.get(frag.index) ?? { id: "", name: "", args: "" }
            if (frag.id) cur.id = frag.id
            if (frag.function?.name) cur.name = frag.function.name
            if (frag.function?.arguments) cur.args += frag.function.arguments
            toolFrags.set(frag.index, cur)
          }
        }
        if (choice?.finish_reason)
          finishReason = choice.finish_reason === "tool_calls" ? "tool_calls" : "stop"
        if (chunk.usage) {
          yield {
            type: "usage",
            inputTokens: chunk.usage.prompt_tokens ?? 0,
            outputTokens: chunk.usage.completion_tokens ?? 0,
          }
        }
      }

      const ordered = [...toolFrags.entries()].sort((a, b) => a[0] - b[0]).map(([, f]) => f)
      for (const frag of ordered) {
        if (!frag.name) continue
        yield {
          type: "tool_call",
          id: frag.id || frag.name,
          name: frag.name,
          arguments: safeParseArgs(frag.args),
        }
      }
      yield { type: "done", finishReason: ordered.length ? "tool_calls" : finishReason }
    },
  }
}
