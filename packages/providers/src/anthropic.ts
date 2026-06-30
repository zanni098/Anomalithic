import type { Message, Provider, ProviderRequest, StreamEvent, ToolSchema } from "@anomalithic/runtime"
import { readSSE } from "./sse.js"

const ANTHROPIC_VERSION = "2023-06-01"
const DEFAULT_MAX_TOKENS = 4096

export interface AnthropicOptions {
  apiKey: string
  baseUrl?: string
  maxTokens?: number
}

interface AnthropicContentBlock {
  type: "text" | "tool_use" | "tool_result"
  text?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: string
}

/** Splits our flat messages into Anthropic's (system string, alternating turns). */
function toAnthropic(messages: Message[]): { system: string; messages: unknown[] } {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n")

  const out: { role: "user" | "assistant"; content: AnthropicContentBlock[] }[] = []
  for (const m of messages) {
    if (m.role === "system") continue
    if (m.role === "tool") {
      out.push({
        role: "user",
        content: [{ type: "tool_result", tool_use_id: m.toolCallId, content: m.content }],
      })
      continue
    }
    if (m.role === "assistant") {
      const blocks: AnthropicContentBlock[] = []
      if (m.content) blocks.push({ type: "text", text: m.content })
      for (const c of m.toolCalls ?? [])
        blocks.push({ type: "tool_use", id: c.id, name: c.name, input: c.arguments })
      out.push({ role: "assistant", content: blocks })
      continue
    }
    out.push({ role: "user", content: [{ type: "text", text: m.content }] })
  }
  return { system, messages: out }
}

function toAnthropicTools(tools?: ToolSchema[]): unknown[] | undefined {
  if (!tools?.length) return undefined
  return tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters }))
}

/** Native Claude provider over the Anthropic Messages API (streaming). */
export function anthropicProvider(opts: AnthropicOptions): Provider {
  const baseUrl = opts.baseUrl ?? "https://api.anthropic.com"
  return {
    id: "anthropic",
    name: "Anthropic",
    async *stream(req: ProviderRequest): AsyncIterable<StreamEvent> {
      const { system, messages } = toAnthropic(req.messages)
      let res: Response
      try {
        res = await fetch(`${baseUrl}/v1/messages`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": opts.apiKey,
            "anthropic-version": ANTHROPIC_VERSION,
          },
          body: JSON.stringify({
            model: req.model,
            max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
            ...(system ? { system } : {}),
            messages,
            tools: toAnthropicTools(req.tools),
            temperature: req.temperature,
            stream: true,
          }),
          signal: req.signal,
        })
      } catch (err) {
        yield { type: "error", error: `network error: ${err instanceof Error ? err.message : String(err)}` }
        return
      }
      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => "")
        yield { type: "error", error: `Anthropic ${res.status}: ${detail.slice(0, 300)}` }
        return
      }

      const blocks = new Map<number, { type: string; id: string; name: string; json: string }>()
      let inputTokens = 0
      let sawToolUse = false

      for await (const data of readSSE(res.body)) {
        let ev: any
        try {
          ev = JSON.parse(data)
        } catch {
          continue
        }
        switch (ev.type) {
          case "message_start":
            inputTokens = ev.message?.usage?.input_tokens ?? 0
            break
          case "content_block_start": {
            const b = ev.content_block
            if (b?.type === "tool_use") {
              sawToolUse = true
              blocks.set(ev.index, { type: "tool_use", id: b.id ?? "", name: b.name ?? "", json: "" })
            } else {
              blocks.set(ev.index, { type: b?.type ?? "text", id: "", name: "", json: "" })
            }
            break
          }
          case "content_block_delta": {
            const d = ev.delta
            if (d?.type === "text_delta" && d.text) yield { type: "text_delta", text: d.text }
            else if (d?.type === "thinking_delta" && d.thinking)
              yield { type: "thinking_delta", text: d.thinking }
            else if (d?.type === "input_json_delta") {
              const cur = blocks.get(ev.index)
              if (cur) cur.json += d.partial_json ?? ""
            }
            break
          }
          case "content_block_stop": {
            const cur = blocks.get(ev.index)
            if (cur?.type === "tool_use" && cur.name) {
              let input: Record<string, unknown> = {}
              try {
                input = cur.json.trim() ? JSON.parse(cur.json) : {}
              } catch {
                input = {}
              }
              yield { type: "tool_call", id: cur.id || cur.name, name: cur.name, arguments: input }
            }
            break
          }
          case "message_delta":
            if (ev.usage?.output_tokens != null)
              yield { type: "usage", inputTokens, outputTokens: ev.usage.output_tokens }
            break
          case "message_stop":
            yield { type: "done", finishReason: sawToolUse ? "tool_calls" : "stop" }
            return
          case "error":
            yield { type: "error", error: ev.error?.message ?? "anthropic stream error" }
            return
        }
      }
      yield { type: "done", finishReason: sawToolUse ? "tool_calls" : "stop" }
    },
  }
}
