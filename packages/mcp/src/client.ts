import type { Tool } from "@anomalithic/runtime"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { type McpToolListItem, adaptMcpTools } from "./adapter.js"

export interface McpServerConfig {
  /** Short name used to prefix this server's tools. */
  name: string
  command: string
  args?: string[]
  env?: Record<string, string>
}

export interface McpConnection {
  tools: Tool[]
  close(): Promise<void>
}

/**
 * Connects to an MCP server over stdio, lists its tools, and adapts them into runtime
 * `Tool`s the agent loop / swarm can call. Uses the official MCP SDK transport.
 */
export async function connectMcp(config: McpServerConfig): Promise<McpConnection> {
  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args ?? [],
    env: { ...(process.env as Record<string, string>), ...config.env },
  })
  const client = new Client({ name: "anomalithic", version: "0.2.0" }, { capabilities: {} })
  await client.connect(transport)

  const listed = (await client.listTools()) as { tools: McpToolListItem[] }
  const caller = {
    async callTool(name: string, args: Record<string, unknown>) {
      return (await client.callTool({ name, arguments: args })) as {
        content?: { type: string; text?: string }[]
        isError?: boolean
      }
    },
  }
  const tools = adaptMcpTools(listed.tools ?? [], caller, config.name)
  return {
    tools,
    close: () => client.close(),
  }
}
