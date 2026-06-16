import type { JsonRpcResponse } from "./jsonrpc.js";
import type { Transport } from "./transport.js";

export interface McpToolInfo {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface Pending {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

/** A minimal MCP client: initialize, list tools, call a tool. */
export class McpClient {
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();

  constructor(private readonly transport: Transport) {
    this.transport.onMessage((msg) => this.handle(msg));
  }

  private handle(msg: unknown): void {
    const res = msg as JsonRpcResponse;
    if (typeof res?.id !== "number") return;
    const pending = this.pending.get(res.id);
    if (!pending) return;
    this.pending.delete(res.id);
    if (res.error) pending.reject(new Error(res.error.message));
    else pending.resolve(res.result);
  }

  private call(method: string, params?: unknown): Promise<unknown> {
    const id = this.nextId++;
    return new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.transport.send({ jsonrpc: "2.0", id, method, params });
    });
  }

  initialize(): Promise<unknown> {
    return this.call("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "anomalithic", version: "0.0.0" },
    });
  }

  async listTools(): Promise<McpToolInfo[]> {
    const result = (await this.call("tools/list")) as { tools?: McpToolInfo[] };
    return result.tools ?? [];
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<{ content: string; isError: boolean }> {
    const result = (await this.call("tools/call", { name, arguments: args })) as {
      content?: { type: string; text?: string }[];
      isError?: boolean;
    };
    const content = (result.content ?? [])
      .map((part) => (part.type === "text" ? (part.text ?? "") : ""))
      .join("");
    return { content, isError: result.isError ?? false };
  }
}
