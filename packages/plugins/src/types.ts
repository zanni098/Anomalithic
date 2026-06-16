import type { HookEvent } from "@anomalithic/hooks";

export interface McpServerSpec {
  name: string;
  command: string;
  args?: string[];
}

export interface PluginHookSpec {
  event: HookEvent;
  command: string;
  args?: string[];
}

/** The `anomalithic.plugin.json` manifest — one bundle of skills, MCP servers, hooks. */
export interface PluginManifest {
  name: string;
  version?: string;
  description?: string;
  /** Directories (relative to the plugin) containing SKILL.md / AGENTS.md skills. */
  skills?: string[];
  mcpServers?: McpServerSpec[];
  hooks?: PluginHookSpec[];
}

export interface Plugin {
  manifest: PluginManifest;
  /** Absolute path to the plugin directory (where the manifest lives). */
  dir: string;
}
