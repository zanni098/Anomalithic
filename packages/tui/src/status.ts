import type { TokenUsage } from "@anomalithic/providers";

/** One-line run summary shown in the TUI footer. */
export function formatStatus(
  model: string,
  turns: number,
  usage: TokenUsage,
  impressions: number,
): string {
  const tokens = usage.inputTokens + usage.outputTokens;
  return `${model} · ${turns} turn(s) · ${tokens} tokens · ${impressions} impression(s)`;
}
