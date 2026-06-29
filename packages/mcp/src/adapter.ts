import type { JSONSchema, Tool } from "@anomalithic/runtime"

export interface McpToolListItem {
  name: string
  description?: string
  inputSchema?: JSONSchema
}

export interface McpContentPart {
  type: string
  text?: string
}

export interface McpCaller {
  callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<{ content?: McpContentPart[]; isError?: boolean }>
}

/** Flattens MCP tool-result content blocks into a single text output. */
export function flattenContent(content?: McpContentPart[]): string {
  if (!content?.length) return "(no content)"
  return content
    .map((c) => (typeof c.text === "string" ? c.text : `[${c.type}]`))
    .join("\n")
    .trim()
}

/**
 * Adapts a list of MCP tools into runtime `Tool`s. Tool names are optionally
 * prefixed (e.g. `filesystem__read_file`) to avoid collisions across servers.
 */
export function adaptMcpTools(list: McpToolListItem[], caller: McpCaller, prefix = ""): Tool[] {
  return list.map((item) => ({
    name: prefix ? `${prefix}__${item.name}` : item.name,
    description: item.description ?? item.name,
    parameters: item.inputSchema ?? { type: "object", properties: {} },
    async execute(args) {
      const res = await caller.callTool(item.name, args)
      return {
        title: item.name,
        output: flattenContent(res.content),
        metadata: { mcp: true, isError: Boolean(res.isError) },
      }
    },
  }))
}
