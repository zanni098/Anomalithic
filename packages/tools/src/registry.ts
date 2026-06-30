import type { Tool } from "@anomalithic/runtime"
import { fsTools } from "./fs.js"
import { shellTool } from "./shell.js"
import { webFetchTool } from "./web.js"

export interface BuiltinToolOptions {
  /** Workspace root for filesystem + shell tools. */
  workspaceRoot: string
  /** Enable the (guarded) shell tool. */
  shell?: boolean
  /** Allow-list for shell commands (only used when `shell` is true). */
  shellAllow?: string[]
  /** Enable the web_fetch tool. */
  web?: boolean
}

/** A simple registry: name → tool, with list/get helpers. */
export class ToolRegistry {
  private readonly map = new Map<string, Tool>()

  constructor(tools: Tool[] = []) {
    for (const t of tools) this.register(t)
  }

  register(tool: Tool): void {
    this.map.set(tool.name, tool)
  }

  get(name: string): Tool | undefined {
    return this.map.get(name)
  }

  list(): Tool[] {
    return [...this.map.values()]
  }
}

/** Assembles the default built-in toolset from options. */
export function builtinTools(opts: BuiltinToolOptions): Tool[] {
  const tools: Tool[] = [...fsTools(opts.workspaceRoot)]
  if (opts.web) tools.push(webFetchTool())
  if (opts.shell) tools.push(shellTool({ cwd: opts.workspaceRoot, allow: opts.shellAllow }))
  return tools
}
