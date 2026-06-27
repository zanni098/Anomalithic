import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpClient, StdioTransport } from "@anomalithic/mcp";
import { FileMemoryStore, recall } from "@anomalithic/memory";
import { discoverPlugins, loadPluginSkills } from "@anomalithic/plugins";
import { type Skill, discoverSkills } from "@anomalithic/skills";

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const memoryDir = () => join(process.cwd(), ".anomalithic", "memory");

// Skills that ship with Anomalithic, discoverable out of the box. Resolved relative
// to the bundled CLI so `anomalithic skills` lists the built-ins (e.g. loop-engineering)
// from any directory. The loader silently skips this path if it isn't present.
const here = dirname(fileURLToPath(import.meta.url));
const BUILTIN_SKILLS_DIR = join(here, "..", "..", "..", "skills");

/** `anomalithic skills [dirs...]` — discover Claude + Codex skills (plus the built-ins). */
export async function skillsCommand(dirs: string[]): Promise<void> {
  const search = dirs.length > 0 ? dirs : [process.cwd(), BUILTIN_SKILLS_DIR];
  const discovered = await discoverSkills(search);

  // Dedupe by path so an overlapping cwd + built-in dir don't list a skill twice.
  const seen = new Set<string>();
  const skills: Skill[] = [];
  for (const skill of discovered) {
    if (seen.has(skill.path)) continue;
    seen.add(skill.path);
    skills.push(skill);
  }

  if (skills.length === 0) {
    console.log(`No skills found under: ${search.join(", ")}`);
    return;
  }
  for (const skill of skills) {
    const mark = skill.source === "claude" ? "▣" : "▢";
    console.log(`${mark} ${skill.name}  ${dim(skill.description)}`);
  }
  console.log(dim(`\n${skills.length} skill(s) · ▣ claude · ▢ codex`));
}

/** `anomalithic memory list | recall <query>` — cross-session memory. */
export async function memoryCommand(action: string, query: string[]): Promise<void> {
  const store = new FileMemoryStore(memoryDir());
  const facts = await store.list();

  if (action === "list") {
    if (facts.length === 0) console.log("No memories yet.");
    for (const fact of facts) console.log(`- ${fact.name}  ${dim(fact.description)}`);
    return;
  }
  if (action === "recall") {
    const hits = recall(facts, query.join(" "), 5);
    if (hits.length === 0) console.log("No relevant memories.");
    for (const fact of hits) console.log(`- ${fact.name}  ${dim(fact.description)}`);
    return;
  }
  console.error(`Unknown memory action "${action}" (use: list | recall <query>)`);
  process.exitCode = 1;
}

/** `anomalithic plugins [dirs...]` — discover installed plugins and what they bundle. */
export async function pluginsCommand(dirs: string[]): Promise<void> {
  const search = dirs.length > 0 ? dirs : [join(process.cwd(), ".anomalithic", "plugins")];
  const plugins = await discoverPlugins(search);
  if (plugins.length === 0) {
    console.log(`No plugins found under: ${search.join(", ")}`);
    return;
  }
  for (const p of plugins) {
    const skills = await loadPluginSkills(p);
    const mcp = p.manifest.mcpServers?.length ?? 0;
    const hooks = p.manifest.hooks?.length ?? 0;
    console.log(
      `◆ ${p.manifest.name}@${p.manifest.version ?? "0.0.0"}  ${dim(p.manifest.description ?? "")}`,
    );
    console.log(dim(`   ${skills.length} skill(s) · ${mcp} mcp · ${hooks} hook(s)`));
  }
}

/** `anomalithic mcp <command> [args...]` — connect to an MCP server, list tools. */
export async function mcpCommand(command: string, args: string[]): Promise<void> {
  const client = new McpClient(new StdioTransport(command, args));
  await client.initialize();
  const tools = await client.listTools();
  console.log(`Connected to "${command}". ${tools.length} tool(s):`);
  for (const tool of tools) console.log(`- ${tool.name}  ${dim(tool.description)}`);
}
