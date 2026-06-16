import type { Hook, HookContext, HookEvent, HookFn, HookResult } from "./types.js";

/** Runs lifecycle hooks and aggregates their allow/deny decisions. */
export class HookRegistry {
  private readonly hooks: Hook[] = [];

  register(hook: Hook): this {
    this.hooks.push(hook);
    return this;
  }

  on(event: HookEvent, run: HookFn): this {
    return this.register({ event, run });
  }

  async run(event: HookEvent, ctx: Omit<HookContext, "event">): Promise<HookResult[]> {
    const full: HookContext = { ...ctx, event };
    const results: HookResult[] = [];
    for (const hook of this.hooks) {
      if (hook.event !== event) continue;
      if (hook.matcher && !hook.matcher(full)) continue;
      const result = await hook.run(full);
      if (result) results.push(result);
    }
    return results;
  }

  /** Deny precedence: any hook returning "deny" blocks the action. */
  async gate(
    event: HookEvent,
    ctx: Omit<HookContext, "event">,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const results = await this.run(event, ctx);
    const denied = results.find((r) => r.decision === "deny");
    if (denied) return { allowed: false, reason: denied.message };
    return { allowed: true };
  }
}
