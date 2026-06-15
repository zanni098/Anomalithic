import type { ToolSchema } from "@anomalithic/providers";

export interface ToolContext {
  sessionId: string;
  signal?: AbortSignal;
}

export interface Tool {
  name: string;
  description: string;
  /** JSON Schema for the tool input. */
  parameters: Record<string, unknown>;
  execute(input: unknown, ctx: ToolContext): Promise<string>;
}

export interface ToolRunResult {
  output: string;
  isError: boolean;
}

/** Holds the tools available to an agent and runs them safely. */
export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  register(tool: Tool): this {
    this.tools.set(tool.name, tool);
    return this;
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return [...this.tools.values()];
  }

  schemas(): ToolSchema[] {
    return this.list().map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));
  }

  async run(name: string, input: unknown, ctx: ToolContext): Promise<ToolRunResult> {
    const tool = this.tools.get(name);
    if (!tool) return { output: `Unknown tool: ${name}`, isError: true };
    try {
      return { output: await tool.execute(input, ctx), isError: false };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { output: `Tool "${name}" failed: ${message}`, isError: true };
    }
  }
}
