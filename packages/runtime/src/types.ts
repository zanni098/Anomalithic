import type { ThinkingImpression } from "@anomalithic/impressions"

// ── Messages ────────────────────────────────────────────────────────────────

export type Role = "system" | "user" | "assistant" | "tool"

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface Message {
  role: Role
  content: string
  /** Present on assistant messages that requested tool calls. */
  toolCalls?: ToolCall[]
  /** Present on `tool` messages: which call this result answers. */
  toolCallId?: string
  /** Tool name, for `tool` messages. */
  name?: string
}

// ── Tools ─────────────────────────────────────────────────────────────────────

/** A JSON-Schema object describing a tool's parameters (kept loose by design). */
export type JSONSchema = Record<string, unknown>

export interface ToolSchema {
  name: string
  description: string
  parameters: JSONSchema
}

export interface ToolResult {
  output: string
  title?: string
  metadata?: Record<string, unknown>
}

export interface ToolContext {
  sessionId: string
  signal?: AbortSignal
  /** Emit a runtime event (so tools can surface progress in the trace). */
  emit?: (event: RuntimeEvent) => void
}

export interface Tool extends ToolSchema {
  execute(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult>
}

// ── Providers ───────────────────────────────────────────────────────────────

/** Low-level events a provider yields while streaming one round-trip. */
export type StreamEvent =
  | { type: "thinking_delta"; text: string }
  | { type: "text_delta"; text: string }
  | { type: "tool_call"; id: string; name: string; arguments: Record<string, unknown> }
  | { type: "usage"; inputTokens: number; outputTokens: number }
  | { type: "done"; finishReason: "stop" | "tool_calls" | "length" | "error" }
  | { type: "error"; error: string }

export interface ProviderRequest {
  model: string
  messages: Message[]
  tools?: ToolSchema[]
  temperature?: number
  signal?: AbortSignal
}

export interface Provider {
  readonly id: string
  readonly name: string
  /** List model ids this provider can serve (best-effort; may be empty). */
  models?(): Promise<string[]>
  stream(req: ProviderRequest): AsyncIterable<StreamEvent>
}

// ── Runtime events (the trace) ────────────────────────────────────────────────

export type RuntimeEvent =
  | { type: "turn.start"; turn: number }
  | { type: "thinking.start"; turn: number; impression: ThinkingImpression }
  | { type: "thinking.delta"; turn: number; text: string }
  | { type: "thinking.end"; turn: number }
  | { type: "text"; text: string }
  | { type: "tool.call"; id: string; name: string; arguments: Record<string, unknown> }
  | { type: "tool.result"; id: string; name: string; output: string; isError: boolean }
  | { type: "usage"; inputTokens: number; outputTokens: number }
  | { type: "turn.end"; turn: number }
  // Multi-agent / swarm trace events
  | { type: "agent.start"; agent: string; role: string }
  | { type: "agent.end"; agent: string; summary: string }
  | { type: "delegate"; from: string; to: string; task: string }
  | { type: "handoff"; from: string; to: string }
  | { type: "done"; text: string }
  | { type: "error"; error: string }

export type RuntimeEventType = RuntimeEvent["type"]
