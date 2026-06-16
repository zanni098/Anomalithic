import { randomUUID } from "node:crypto";
import type {
  ContentPart,
  Message,
  StopReason,
  TokenUsage,
  ToolUsePart,
} from "@anomalithic/providers";
import type { Provider } from "@anomalithic/providers";
import { EventBus } from "./events.js";
import { ImpressionSigner, type ThinkingImpression, generateImpressionKey } from "./impression.js";
import type { ToolRegistry } from "./tools.js";

export interface AgentOptions {
  provider: Provider;
  model: string;
  system?: string;
  tools?: ToolRegistry;
  /** Hard cap on provider round-trips, to bound tool loops. */
  maxTurns?: number;
  maxTokens?: number;
  temperature?: number;
  sessionId?: string;
  /** HMAC key for signing thinking impressions; generated per-session if omitted. */
  impressionKey?: string;
  bus?: EventBus;
  /** Called after every turn with a snapshot — use it to persist/resume long runs. */
  onTurnEnd?: (snapshot: TurnSnapshot) => unknown;
}

export interface AgentRunResult {
  text: string;
  messages: Message[];
  turns: number;
  usage: TokenUsage;
  impressions: ThinkingImpression[];
}

export interface TurnSnapshot {
  turn: number;
  messages: Message[];
  impressions: ThinkingImpression[];
  usage: TokenUsage;
}

const DEFAULT_MAX_TURNS = 16;

/**
 * The minimal agent loop: gather → think → act (tools) → observe → repeat.
 * Emits provider-agnostic thinking windows so the ad layer works on any backend,
 * not just models that expose native reasoning tokens.
 */
export class Agent {
  readonly bus: EventBus;
  readonly sessionId: string;
  private readonly signer: ImpressionSigner;

  constructor(private readonly opts: AgentOptions) {
    this.bus = opts.bus ?? new EventBus();
    this.sessionId = opts.sessionId ?? randomUUID();
    this.signer = new ImpressionSigner(
      opts.impressionKey ?? generateImpressionKey(),
      this.sessionId,
    );
  }

  async run(input: string | Message[], signal?: AbortSignal): Promise<AgentRunResult> {
    const messages: Message[] = typeof input === "string" ? [userMessage(input)] : [...input];
    const impressions: ThinkingImpression[] = [];
    const total: TokenUsage = { inputTokens: 0, outputTokens: 0 };
    const maxTurns = this.opts.maxTurns ?? DEFAULT_MAX_TURNS;
    const toolSchemas = this.opts.tools?.schemas();

    let turn = 0;
    let finalText = "";

    try {
      while (turn < maxTurns) {
        turn += 1;
        this.bus.emit("turn.start", { turn });

        const { content, stopReason, usage, turnText } = await this.streamTurn(
          turn,
          messages,
          toolSchemas,
          impressions,
          signal,
        );
        total.inputTokens += usage.inputTokens;
        total.outputTokens += usage.outputTokens;
        finalText = turnText;
        messages.push({ role: "assistant", content });
        this.bus.emit("turn.end", { turn, stopReason });

        const toolUses =
          stopReason === "tool_use" && this.opts.tools
            ? content.filter((p): p is ToolUsePart => p.type === "tool_use")
            : [];

        if (this.opts.tools && toolUses.length > 0) {
          const results: ContentPart[] = [];
          for (const call of toolUses) {
            const { output, isError } = await this.opts.tools.run(call.name, call.input, {
              sessionId: this.sessionId,
              signal,
            });
            this.bus.emit("tool.result", { id: call.id, name: call.name, output, isError });
            results.push({ type: "tool_result", toolUseId: call.id, content: output, isError });
          }
          messages.push({ role: "tool", content: results });
        }

        if (this.opts.onTurnEnd) {
          await this.opts.onTurnEnd({
            turn,
            messages: [...messages],
            impressions: [...impressions],
            usage: { ...total },
          });
        }

        if (toolUses.length === 0) break;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.bus.emit("error", { error });
      throw error;
    }

    this.bus.emit("done", { text: finalText });
    return { text: finalText, messages, turns: turn, usage: total, impressions };
  }

  private async streamTurn(
    turn: number,
    messages: Message[],
    toolSchemas: ReturnType<ToolRegistry["schemas"]> | undefined,
    impressions: ThinkingImpression[],
    signal?: AbortSignal,
  ) {
    const startedAt = Date.now();
    const impression = this.signer.mint(turn, startedAt);
    impressions.push(impression);
    this.bus.emit("thinking.start", { impression });

    let thinkingEnded = false;
    const endThinking = () => {
      if (thinkingEnded) return;
      thinkingEnded = true;
      this.bus.emit("thinking.end", {
        impressionId: impression.id,
        durationMs: Date.now() - startedAt,
      });
    };

    const content: ContentPart[] = [];
    let pendingText = "";
    let turnText = "";
    let stopReason: StopReason = "end_turn";
    let usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };

    const flushText = () => {
      if (pendingText.length > 0) {
        content.push({ type: "text", text: pendingText });
        pendingText = "";
      }
    };

    const stream = this.opts.provider.stream({
      model: this.opts.model,
      messages,
      system: this.opts.system,
      tools: toolSchemas,
      maxTokens: this.opts.maxTokens,
      temperature: this.opts.temperature,
      signal,
    });

    for await (const event of stream) {
      switch (event.type) {
        case "thinking_delta":
          this.bus.emit("thinking.delta", { text: event.text });
          break;
        case "text_delta":
          endThinking();
          pendingText += event.text;
          turnText += event.text;
          this.bus.emit("text", { text: event.text });
          break;
        case "tool_use":
          endThinking();
          flushText();
          content.push({ type: "tool_use", id: event.id, name: event.name, input: event.input });
          this.bus.emit("tool.call", { id: event.id, name: event.name, input: event.input });
          break;
        case "usage":
          usage = { inputTokens: event.inputTokens, outputTokens: event.outputTokens };
          break;
        case "done":
          stopReason = event.stopReason;
          break;
        default:
          break;
      }
    }

    endThinking();
    flushText();
    return { content, stopReason, usage, turnText };
  }
}

function userMessage(text: string): Message {
  return { role: "user", content: [{ type: "text", text }] };
}
