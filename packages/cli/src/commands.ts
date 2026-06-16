import { join } from "node:path";
import { McpClient, StdioTransport } from "@anomalithic/mcp";
import { FileMemoryStore, recall } from "@anomalithic/memory";
import { discoverSkills } from "@anomalithic/skills";

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const memoryDir = () => join(process.cwd(), ".anomalithic", "memory");

/** `anomalithic skills [dirs...]` — discover Claude + Codex skills. */
export async function skillsCommand(dirs: string[]): Promise<void> {
  const search = dirs.length > 0 ? dirs : [process.cwd()];
  const skills = await discoverSkills(search);
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

/** `anomalithic mcp <command> [args...]` — connect to an MCP server, list tools. */
export async function mcpCommand(command: string, args: string[]): Promise<void> {
  const client = new McpClient(new StdioTransport(command, args));
  await client.initialize();
  const tools = await client.listTools();
  console.log(`Connected to "${command}". ${tools.length} tool(s):`);
  for (const tool of tools) console.log(`- ${tool.name}  ${dim(tool.description)}`);
}
