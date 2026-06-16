import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { type Hook, commandHook } from "@anomalithic/hooks";
import { type Skill, discoverSkills } from "@anomalithic/skills";
import type { McpServerSpec, Plugin, PluginManifest } from "./types.js";

const MANIFEST = "anomalithic.plugin.json";

/** Finds plugins (a dir with anomalithic.plugin.json) directly under each given dir. */
export async function discoverPlugins(dirs: string[]): Promise<Plugin[]> {
  const plugins: Plugin[] = [];
  for (const dir of dirs) {
    const candidates = [dir];
    try {
      for (const entry of await readdir(dir)) candidates.push(join(dir, entry));
    } catch {
      // unreadable dir
    }
    for (const candidate of candidates) {
      try {
        const raw = await readFile(join(candidate, MANIFEST), "utf8");
        const manifest = JSON.parse(raw) as PluginManifest;
        if (manifest.name) plugins.push({ manifest, dir: candidate });
      } catch {
        // not a plugin directory
      }
    }
  }
  return plugins;
}

/** Resolves the plugin's bundled skills (Claude + Codex). */
export function loadPluginSkills(plugin: Plugin): Promise<Skill[]> {
  const dirs = (plugin.manifest.skills ?? []).map((s) => join(plugin.dir, s));
  return dirs.length > 0 ? discoverSkills(dirs) : Promise.resolve([]);
}

/** Builds runnable command hooks declared by the plugin. */
export function pluginHooks(plugin: Plugin): Hook[] {
  return (plugin.manifest.hooks ?? []).map((h) => commandHook(h.event, h.command, h.args ?? []));
}

/** The MCP servers the plugin wants connected. */
export function pluginMcpServers(plugin: Plugin): McpServerSpec[] {
  return plugin.manifest.mcpServers ?? [];
}
