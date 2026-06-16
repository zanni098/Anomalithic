import { describe, expect, it } from "vitest";
import { Gateway } from "../src/gateway.js";
import { MockAdapter } from "../src/mock.js";

describe("Gateway", () => {
  it("routes an inbound message through the handler and replies", async () => {
    const adapter = new MockAdapter();
    const gateway = new Gateway({
      adapters: [adapter],
      handle: async (m) => `echo: ${m.text}`,
    });
    await gateway.start();

    adapter.receive("hello", "chat-1");
    await new Promise((r) => setTimeout(r, 0));

    expect(adapter.sent).toEqual([{ chatId: "chat-1", text: "echo: hello" }]);
    await gateway.stop();
  });

  it("reports handler errors without crashing", async () => {
    const adapter = new MockAdapter();
    const errors: string[] = [];
    const gateway = new Gateway({
      adapters: [adapter],
      handle: async () => {
        throw new Error("boom");
      },
      onError: (e) => errors.push(e.message),
    });
    await gateway.start();

    adapter.receive("x");
    await new Promise((r) => setTimeout(r, 0));

    expect(errors).toEqual(["boom"]);
    expect(adapter.sent).toHaveLength(0);
  });
});
