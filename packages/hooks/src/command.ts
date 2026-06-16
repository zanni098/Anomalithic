import { spawn } from "node:child_process";
import type { Hook, HookContext, HookEvent, HookResult } from "./types.js";

/** Wraps an external command as a hook; passes the context as JSON on stdin. */
export function commandHook(event: HookEvent, command: string, args: string[] = []): Hook {
  return {
    event,
    run: (ctx: HookContext) =>
      new Promise<HookResult | undefined>((resolve) => {
        const child = spawn(command, args, { stdio: ["pipe", "pipe", "ignore"] });
        let out = "";
        child.stdout.on("data", (chunk: Buffer) => {
          out += chunk.toString("utf8");
        });
        child.on("error", () => resolve(undefined));
        child.on("close", () => {
          const trimmed = out.trim();
          if (!trimmed) {
            resolve(undefined);
            return;
          }
          try {
            resolve(JSON.parse(trimmed) as HookResult);
          } catch {
            resolve(undefined);
          }
        });
        child.stdin.end(JSON.stringify(ctx));
      }),
  };
}
