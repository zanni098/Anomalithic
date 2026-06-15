/**
 * Unified, provider-agnostic types. Every backend (Anthropic, OpenAI-compatible,
 * local, mock) maps onto these so the rest of Anomalithic never branches on vendor.
 */

export type Role = "system" | "user" | "assistant" | "tool";

export interface TextPart {
  type: "text";
  text: string;
}

export interface ToolUsePart {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
}

export interface ToolResultPart {
  type: "tool_result";
  toolUseId: string;
  content: string;
  isError?: boolean;
}

export type ContentPart = TextPart | ToolUsePart | ToolResultPart;

export interface Message {
  role: Role;
  content: ContentPart[];
}

export interface ToolSchema {
  name: string;
  description: string;
  /** JSON Schema object for the tool's parameters. */
  parameters: Record<string, unknown>;
}

export interface ProviderCapabilities {
  tools: boolean;
  vision: boolean;
  /** Whether the model exposes a separate reasoning / "thinking" stream. */
  reasoning: boolean;
  maxContextTokens: number;
  streaming: boolean;
}

export interface GenerateOptions {
  model: string;
  messages: Message[];
  system?: string;
  tools?: ToolSchema[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

export type StopReason = "end_turn" | "tool_use" | "max_tokens" | "stop" | "error";

/**
 * Normalised streaming events. `thinking_*` events are first-class because they
 * are what the Anomalithic ad layer subscribes to.
 */
export type StreamEvent =
  | { type: "thinking_start" }
  | { type: "thinking_delta"; text: string }
  | { type: "thinking_end" }
  | { type: "text_delta"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "usage"; inputTokens: number; outputTokens: number }
  | { type: "done"; stopReason: StopReason };

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface GenerateResult {
  message: Message;
  stopReason: StopReason;
  usage: TokenUsage;
}

export interface Provider {
  readonly id: string;
  capabilities(model: string): ProviderCapabilities;
  generate(opts: GenerateOptions): Promise<GenerateResult>;
  stream(opts: GenerateOptions): AsyncIterable<StreamEvent>;
}
