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

export interface OpenAIOptions {
  apiKey: string;
  /** Override to target OpenRouter, Ollama, or any OpenAI-compatible endpoint. */
  baseUrl?: string;
}

/** OpenAI-compatible Chat Completions backend (OpenAI, OpenRouter, Ollama, local). */
export class OpenAIProvider implements Provider {
  readonly id = "openai";
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(opts: OpenAIOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? "https://api.openai.com/v1").replace(/\/+$/, "");
  }

  capabilities(model: string): ProviderCapabilities {
    const reasoning = /(^|[^a-z])(o\d|r1|reason|deepseek-r|gpt-5)/i.test(model);
    return { tools: true, vision: true, reasoning, maxContextTokens: 128_000, streaming: true };
  }

  async *stream(opts: GenerateOptions): AsyncIterable<StreamEvent> {
    const body: Record<string, unknown> = {
      model: opts.model,
      stream: true,
      stream_options: { include_usage: true },
      messages: toOpenAIMessages(opts.system, opts.messages),
    };
    if (opts.tools) body.tools = opts.tools.map(toOpenAITool);
    if (opts.maxTokens != null) body.max_tokens = opts.maxTokens;
    if (opts.temperature != null) body.temperature = opts.temperature;

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`OpenAI API error ${res.status}: ${await safeText(res)}`);
    }

    const toolCalls = new Map<number, { id: string; name: string; args: string }>();
    let thinkingOpen = false;
    let inputTokens = 0;
    let outputTokens = 0;
    let stopReason: StopReason = "end_turn";

    for await (const { data } of parseSSE(res.body)) {
      if (data === "[DONE]") break;
      const json = safeJson(data) as {
        choices?: {
          delta?: {
            content?: string | null;
            reasoning_content?: string | null;
            tool_calls?: {
              index: number;
              id?: string;
              function?: { name?: string; arguments?: string };
            }[];
          };
          finish_reason?: string | null;
        }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      const choice = json.choices?.[0];
      const delta = choice?.delta;

      if (delta?.reasoning_content) {
        if (!thinkingOpen) {
          thinkingOpen = true;
          yield { type: "thinking_start" };
        }
        yield { type: "thinking_delta", text: delta.reasoning_content };
      }
      if (delta?.content) {
        if (thinkingOpen) {
          thinkingOpen = false;
          yield { type: "thinking_end" };
        }
        yield { type: "text_delta", text: delta.content };
      }
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const existing = toolCalls.get(tc.index) ?? { id: "", name: "", args: "" };
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.name = tc.function.name;
          if (tc.function?.arguments) existing.args += tc.function.arguments;
          toolCalls.set(tc.index, existing);
        }
      }
      if (choice?.finish_reason) stopReason = mapFinishReason(choice.finish_reason);
      if (json.usage) {
        inputTokens = json.usage.prompt_tokens ?? inputTokens;
        outputTokens = json.usage.completion_tokens ?? outputTokens;
      }
    }

    if (thinkingOpen) yield { type: "thinking_end" };
    for (const tc of [...toolCalls.values()]) {
      yield { type: "tool_use", id: tc.id, name: tc.name, input: tc.args ? safeJson(tc.args) : {} };
    }
    yield { type: "usage", inputTokens, outputTokens };
    yield { type: "done", stopReason };
  }

  generate(opts: GenerateOptions): Promise<GenerateResult> {
    return collect(this.stream(opts));
  }
}

function mapFinishReason(reason: string): StopReason {
  switch (reason) {
    case "stop":
      return "end_turn";
    case "tool_calls":
      return "tool_use";
    case "length":
      return "max_tokens";
    default:
      return "end_turn";
  }
}

function toOpenAIMessages(system: string | undefined, messages: Message[]) {
  const out: Record<string, unknown>[] = [];
  if (system) out.push({ role: "system", content: system });

  for (const m of messages) {
    if (m.role === "tool") {
      for (const part of m.content) {
        if (part.type === "tool_result") {
          out.push({ role: "tool", tool_call_id: part.toolUseId, content: part.content });
        }
      }
      continue;
    }

    const text = m.content
      .filter((p): p is Extract<ContentPart, { type: "text" }> => p.type === "text")
      .map((p) => p.text)
      .join("");
    const toolUses = m.content.filter(
      (p): p is Extract<ContentPart, { type: "tool_use" }> => p.type === "tool_use",
    );

    if (m.role === "assistant" && toolUses.length > 0) {
      out.push({
        role: "assistant",
        content: text || null,
        tool_calls: toolUses.map((t) => ({
          id: t.id,
          type: "function",
          function: { name: t.name, arguments: JSON.stringify(t.input ?? {}) },
        })),
      });
    } else {
      out.push({ role: m.role, content: text });
    }
  }
  return out;
}

function toOpenAITool(tool: ToolSchema) {
  return {
    type: "function",
    function: { name: tool.name, description: tool.description, parameters: tool.parameters },
  };
}
