import { describe, expect, it } from "vitest";
import { HookRegistry } from "../src/registry.js";

describe("HookRegistry", () => {
  it("runs matching hooks in order and filters by matcher", async () => {
    const seen: string[] = [];
    const registry = new HookRegistry()
      .on("PreToolUse", () => {
        seen.push("a");
      })
      .register({
        event: "PreToolUse",
        matcher: (ctx) => ctx.data.tool === "bash",
        run: () => {
          seen.push("b");
        },
      });

    await registry.run("PreToolUse", { sessionId: "s", data: { tool: "read" } });
    expect(seen).toEqual(["a"]);

    seen.length = 0;
    await registry.run("PreToolUse", { sessionId: "s", data: { tool: "bash" } });
    expect(seen).toEqual(["a", "b"]);
  });

  it("gate denies when any hook denies", async () => {
    const registry = new HookRegistry().on("PreToolUse", () => ({
      decision: "deny",
      message: "blocked",
    }));
    const gate = await registry.gate("PreToolUse", { sessionId: "s", data: {} });
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe("blocked");
  });

  it("gate allows when nothing denies", async () => {
    const registry = new HookRegistry().on("PreToolUse", () => ({ decision: "allow" }));
    const gate = await registry.gate("PreToolUse", { sessionId: "s", data: {} });
    expect(gate.allowed).toBe(true);
  });
});
