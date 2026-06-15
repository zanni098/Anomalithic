import type { ContentPart, GenerateResult, StopReason, StreamEvent, TokenUsage } from "./types.js";

/** Drains a stream into a single non-streaming result. */
export async function collect(events: AsyncIterable<StreamEvent>): Promise<GenerateResult> {
  const content: ContentPart[] = [];
  let text = "";
  let stopReason: StopReason = "end_turn";
  let usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };

  const flushText = () => {
    if (text.length > 0) {
      content.push({ type: "text", text });
      text = "";
    }
  };

  for await (const event of events) {
    switch (event.type) {
      case "text_delta":
        text += event.text;
        break;
      case "tool_use":
        flushText();
        content.push({ type: "tool_use", id: event.id, name: event.name, input: event.input });
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
  flushText();
  return { message: { role: "assistant", content }, stopReason, usage };
}
