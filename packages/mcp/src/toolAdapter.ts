import type { Tool } from "@anomalithic/core";
import type { McpClient, McpToolInfo } from "./client.js";

/** Adapts MCP tools into core Tools so they can be registered in a ToolRegistry. */
export function mcpToolsToTools(client: McpClient, tools: McpToolInfo[]): Tool[] {
  return tools.map((info) => ({
    name: info.name,
    description: info.description,
    parameters: info.inputSchema,
    execute: async (input: unknown) => {
      const args = (input ?? {}) as Record<string, unknown>;
      const { content, isError } = await client.callTool(info.name, args);
      if (isError) throw new Error(content);
      return content;
    },
  }));
}
