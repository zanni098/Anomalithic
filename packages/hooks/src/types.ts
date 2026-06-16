export type HookEvent =
  | "SessionStart"
  | "PreToolUse"
  | "PostToolUse"
  | "Stop"
  | "PreCompact"
  | "ThinkingStart"
  | "ThinkingEnd";

export interface HookContext {
  event: HookEvent;
  sessionId: string;
  data: Record<string, unknown>;
}

export interface HookResult {
  decision?: "allow" | "deny" | "ask";
  message?: string;
  mutatedData?: Record<string, unknown>;
}

// biome-ignore lint/suspicious/noConfusingVoidType: void lets a hook return nothing or a HookResult
export type HookFn = (ctx: HookContext) => Promise<HookResult | void> | HookResult | void;

export interface Hook {
  event: HookEvent;
  matcher?: (ctx: HookContext) => boolean;
  run: HookFn;
}
