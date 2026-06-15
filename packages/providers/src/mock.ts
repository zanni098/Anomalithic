import { collect } from "./collect.js";
import type {
  GenerateOptions,
  GenerateResult,
  Provider,
  ProviderCapabilities,
  StreamEvent,
} from "./types.js";

export interface MockTurn {
  thinking?: string;
  text?: string;
  toolUse?: { name: string; input: unknown }[];
}

/**
 * Deterministic provider for tests and offline demos. Plays back a scripted list
 * of turns; the last turn repeats if more are requested than were supplied.
 */
export class MockProvider implements Provider {
  readonly id = "mock";
  private readonly turns: MockTurn[];
  private cursor = 0;

  constructor(
    turns: MockTurn[] = [{ thinking: "considering", text: "Hello from the mock provider." }],
  ) {
    this.turns = turns.length > 0 ? turns : [{ text: "" }];
  }

  capabilities(_model: string): ProviderCapabilities {
    return {
      tools: true,
      vision: false,
      reasoning: true,
      maxContextTokens: 200_000,
      streaming: true,
    };
  }

  async *stream(_opts: GenerateOptions): AsyncIterable<StreamEvent> {
    const turn = this.turns[Math.min(this.cursor, this.turns.length - 1)] ?? {};
    this.cursor += 1;

    yield { type: "thinking_start" };
    if (turn.thinking) yield { type: "thinking_delta", text: turn.thinking };
    yield { type: "thinking_end" };

    if (turn.text) {
      for (const chunk of turn.text.match(/[\s\S]{1,8}/g) ?? []) {
        yield { type: "text_delta", text: chunk };
      }
    }

    let usedTool = false;
    if (turn.toolUse) {
      for (const [j, t] of turn.toolUse.entries()) {
        usedTool = true;
        yield { type: "tool_use", id: `mock_${this.cursor}_${j}`, name: t.name, input: t.input };
      }
    }

    yield { type: "usage", inputTokens: 10, outputTokens: 5 };
    yield { type: "done", stopReason: usedTool ? "tool_use" : "end_turn" };
  }

  generate(opts: GenerateOptions): Promise<GenerateResult> {
    return collect(this.stream(opts));
  }
}
