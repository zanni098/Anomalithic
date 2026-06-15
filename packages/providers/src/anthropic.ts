import { collect } from "./collect.js";
import { parseSSE, safeJson, safeText } from "./sse.js";
import type {
  ContentPart,
  GenerateOptions,
  GenerateResult,
  Message,
  Provider,
  ProviderCapabilities,
  StopReason,
  StreamEvent,
  ToolSchema,
} from "./types.js";

const ANTHROPIC_VERSION = "2023-06-01";

export interface AnthropicOptions {
  apiKey: string;
  baseUrl?: string;
}

/** Anthropic Messages API backend with streaming + reasoning ("thinking") support. */
export class AnthropicProvider implements Provider {
  readonly id = "anthropic";
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(opts: AnthropicOptions) {
    if (!opts.apiKey) throw new Error("AnthropicProvider requires an apiKey");
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? "https://api.anthropic.com").replace(/\/+$/, "");
  }

  capabilities(_model: string): ProviderCapabilities {
    return {
      tools: true,
      vision: true,
      reasoning: true,
      maxContextTokens: 200_000,
      streaming: true,
    };
  }

  async *stream(opts: GenerateOptions): AsyncIterable<StreamEvent> {
    const body: Record<string, unknown> = {
      model: opts.model,
      max_tokens: opts.maxTokens ?? 4096,
      stream: true,
      messages: toAnthropicMessages(opts.messages),
    };
    if (opts.system) body.system = opts.system;
    if (opts.tools) body.tools = opts.tools.map(toAnthropicTool);
    if (opts.temperature != null) body.temperature = opts.temperature;

    const res = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`Anthropic API error ${res.status}: ${await safeText(res)}`);
    }

    const toolBlocks = new Map<number, { id: string; name: string; json: string }>();
    let inThinking = false;
    let inputTokens = 0;
    let outputTokens = 0;
    let stopReason: StopReason = "end_turn";

    for await (const { event, data } of parseSSE(res.body)) {
      if (data === "[DONE]") break;
      const json = safeJson(data) as Record<string, unknown>;
      const kind = event ?? (json.type as string | undefined);

      switch (kind) {
        case "message_start": {
          const usage = (json.message as { usage?: { input_tokens?: number } } | undefined)?.usage;
          inputTokens = usage?.input_tokens ?? 0;
          break;
        }
        case "content_block_start": {
          const block = json.content_block as
            | { type?: string; id?: string; name?: string }
            | undefined;
          const index = json.index as number;
          if (block?.type === "thinking") {
            inThinking = true;
            yield { type: "thinking_start" };
          } else if (block?.type === "tool_use") {
            toolBlocks.set(index, { id: block.id ?? "", name: block.name ?? "", json: "" });
          }
          break;
        }
        case "content_block_delta": {
          const delta = json.delta as
            | { type?: string; text?: string; thinking?: string; partial_json?: string }
            | undefined;
          const index = json.index as number;
          if (delta?.type === "text_delta") yield { type: "text_delta", text: delta.text ?? "" };
          else if (delta?.type === "thinking_delta")
            yield { type: "thinking_delta", text: delta.thinking ?? "" };
          else if (delta?.type === "input_json_delta") {
            const b = toolBlocks.get(index);
            if (b) b.json += delta.partial_json ?? "";
          }
          break;
        }
        case "content_block_stop": {
          const index = json.index as number;
          if (inThinking) {
            inThinking = false;
            yield { type: "thinking_end" };
          }
          const b = toolBlocks.get(index);
          if (b) {
            toolBlocks.delete(index);
            yield {
              type: "tool_use",
              id: b.id,
              name: b.name,
              input: b.json ? safeJson(b.json) : {},
            };
          }
          break;
        }
        case "message_delta": {
          const delta = json.delta as { stop_reason?: string } | undefined;
          const usage = json.usage as { output_tokens?: number } | undefined;
          if (delta?.stop_reason) stopReason = mapStopReason(delta.stop_reason);
          if (usage?.output_tokens != null) outputTokens = usage.output_tokens;
          break;
        }
        default:
          break;
      }
    }

    yield { type: "usage", inputTokens, outputTokens };
    yield { type: "done", stopReason };
  }

  generate(opts: GenerateOptions): Promise<GenerateResult> {
    return collect(this.stream(opts));
  }
}

function mapStopReason(reason: string): StopReason {
  switch (reason) {
    case "end_turn":
      return "end_turn";
    case "tool_use":
      return "tool_use";
    case "max_tokens":
      return "max_tokens";
    case "stop_sequence":
      return "stop";
    default:
      return "end_turn";
  }
}

function toAnthropicMessages(messages: Message[]) {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "tool" ? "user" : m.role,
      content: m.content.map(toAnthropicBlock),
    }));
}

function toAnthropicBlock(part: ContentPart) {
  switch (part.type) {
    case "text":
      return { type: "text", text: part.text };
    case "tool_use":
      return { type: "tool_use", id: part.id, name: part.name, input: part.input };
    case "tool_result":
      return {
        type: "tool_result",
        tool_use_id: part.toolUseId,
        content: part.content,
        is_error: part.isError ?? false,
      };
  }
}

function toAnthropicTool(tool: ToolSchema) {
  return { name: tool.name, description: tool.description, input_schema: tool.parameters };
}
