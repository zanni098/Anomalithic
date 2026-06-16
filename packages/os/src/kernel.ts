import { Agent, type Tool, ToolRegistry } from "@anomalithic/core";
import { HookRegistry } from "@anomalithic/hooks";
import { McpClient, StdioTransport, mcpToolsToTools } from "@anomalithic/mcp";
import { FileMemoryStore, type MemoryFact, recall } from "@anomalithic/memory";
import type { Provider } from "@anomalithic/providers";
import { PermissionPolicy, type PermissionRules } from "@anomalithic/security";
import { type Skill, discoverSkills } from "@anomalithic/skills";

export interface KernelOptions {
  provider: Provider;
  model: string;
  system?: string;
  /** Directory backing cross-session memory. Memory is disabled if omitted. */
  memoryDir?: string;
  permissions?: PermissionRules;
}

/**
 * The agentic-OS kernel. It wires every subsystem — providers, tools, hooks,
 * memory, skills, MCP, and the permission policy — into one runtime, and hands
 * out fully-equipped agents. Think of it as the init process for autonomous work.
 */
export class Kernel {
  readonly tools = new ToolRegistry();
  readonly hooks = new HookRegistry();
  readonly policy: PermissionPolicy;
  readonly memory?: FileMemoryStore;

  constructor(private readonly opts: KernelOptions) {
    this.policy = new PermissionPolicy(opts.permissions ?? { default: "ask" });
    if (opts.memoryDir) this.memory = new FileMemoryStore(opts.memoryDir);
  }

  /** Registers a local tool with the kernel's shared registry. */
  registerTool(tool: Tool): this {
    this.tools.register(tool);
    return this;
  }

  /** Discovers Claude + Codex skills under the given directories. */
  loadSkills(dirs: string[]): Promise<Skill[]> {
    return discoverSkills(dirs);
  }

  /** Connects to an MCP server over stdio and registers its tools. */
  async connectMcp(command: string, args: string[] = []): Promise<Tool[]> {
    const client = new McpClient(new StdioTransport(command, args));
    await client.initialize();
    const tools = mcpToolsToTools(client, await client.listTools());
    for (const tool of tools) this.tools.register(tool);
    return tools;
  }

  /** Recalls memory facts relevant to a query (empty if memory is disabled). */
  async recall(query: string, k = 5): Promise<MemoryFact[]> {
    if (!this.memory) return [];
    return recall(await this.memory.list(), query, k);
  }

  /** Builds an agent equipped with the kernel's tools and event bus. */
  createAgent(): Agent {
    return new Agent({
      provider: this.opts.provider,
      model: this.opts.model,
      system: this.opts.system,
      tools: this.tools,
    });
  }
}
