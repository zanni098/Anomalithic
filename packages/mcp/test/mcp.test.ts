import { describe, expect, it } from "vitest";
import { McpClient } from "../src/client.js";
import { mcpToolsToTools } from "../src/toolAdapter.js";
import type { Transport } from "../src/transport.js";

/** A synchronous in-memory MCP server for testing the client without spawning. */
class FakeTransport implements Transport {
  private cb: (msg: unknown) => void = () => {};

  onMessage(cb: (msg: unknown) => void): void {
    this.cb = cb;
  }

  close(): void {}

  send(msg: unknown): void {
    const req = msg as { id: number; method: string; params?: unknown };
    queueMicrotask(() => this.cb(this.respond(req)));
  }

  private respond(req: { id: number; method: string; params?: unknown }): unknown {
    if (req.method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id: req.id,
        result: {
          tools: [{ name: "echo", description: "echo text", inputSchema: { type: "object" } }],
        },
      };
    }
    if (req.method === "tools/call") {
      const params = req.params as { arguments?: { text?: string } };
      return {
        jsonrpc: "2.0",
        id: req.id,
        result: { content: [{ type: "text", text: params.arguments?.text ?? "" }], isError: false },
      };
    }
    return { jsonrpc: "2.0", id: req.id, result: {} };
  }
}

describe("McpClient", () => {
  it("lists tools and calls a tool through the adapter", async () => {
    const client = new McpClient(new FakeTransport());
    await client.initialize();

    const tools = await client.listTools();
    expect(tools[0]?.name).toBe("echo");

    const adapted = mcpToolsToTools(client, tools);
    const tool = adapted[0];
    expect(tool).toBeDefined();
    const output = await tool?.execute({ text: "hi" }, { sessionId: "s" });
    expect(output).toBe("hi");
  });
});
