import { EventBus, type Message, type Provider, type Tool, runAgent } from "@anomalithic/runtime"
import { type AgentDefinition, findAgent } from "./agent.js"

export interface RunSwarmOptions {
  provider: Provider
  model: string
  /** The user's goal. */
  task: string
  agents: AgentDefinition[]
  /** Resolve the concrete tools a specialist should run with. */
  toolsFor?: (agent: AgentDefinition) => Tool[]
  bus?: EventBus
  impressionKey?: string
  signal?: AbortSignal
  /** Max provider round-trips for the orchestrator (specialists use `specialistMaxTurns`). */
  maxTurns?: number
  specialistMaxTurns?: number
}

export interface RunSwarmResult {
  text: string
  agentsInvoked: string[]
}

const ORCH_MAX_TURNS = 12
const SPECIALIST_MAX_TURNS = 8

/**
 * Runs a multi-agent swarm. The Orchestrator (a normal agent loop) is given three
 * coordination tools — delegate, delegate_parallel, handoff — that run specialists as
 * bracketed sub-agents. Fuses OpenSwarm's orchestrator/SendMessage/Handoff model with
 * opencode's tool-driven subagent execution. Every step is emitted to `bus` as a trace.
 */
export async function runSwarm(opts: RunSwarmOptions): Promise<RunSwarmResult> {
  const bus = opts.bus ?? new EventBus()
  const orchestrator = opts.agents.find((a) => a.role === "orchestrator") ?? opts.agents[0]
  if (!orchestrator) throw new Error("Swarm has no agents")
  const specialists = opts.agents.filter((a) => a.role === "specialist")
  const specialistNames = specialists.map((s) => s.name)
  const invoked = new Set<string>()

  /** Runs one specialist on its own bus, forwarding tool events to the main trace. */
  async function runSpecialist(name: string, task: string): Promise<string> {
    const def = findAgent(opts.agents, name)
    if (!def || def.role !== "specialist") {
      return `No such specialist: "${name}". Available: ${specialistNames.join(", ")}.`
    }
    invoked.add(def.name)
    bus.emit({ type: "agent.start", agent: def.name, role: def.role })

    const subBus = new EventBus()
    subBus.on("tool.call", (e) => bus.emit(e))
    subBus.on("tool.result", (e) => bus.emit(e))

    const messages: Message[] = [
      { role: "system", content: def.systemPrompt },
      { role: "user", content: task },
    ]
    const result = await runAgent({
      provider: opts.provider,
      model: def.model ?? opts.model,
      messages,
      tools: opts.toolsFor?.(def) ?? [],
      impressionKey: opts.impressionKey,
      signal: opts.signal,
      maxTurns: opts.specialistMaxTurns ?? SPECIALIST_MAX_TURNS,
      sessionId: def.name,
      bus: subBus,
    })
    bus.emit({ type: "agent.end", agent: def.name, summary: result.text.slice(0, 200) })
    return result.text || "(no output)"
  }

  const rosterDoc = specialists.map((s) => `- ${s.name}: ${s.description}`).join("\n")

  const delegateTool: Tool = {
    name: "delegate",
    description: `Delegate a task to ONE specialist and get its result back. specialist must be one of:\n${rosterDoc}`,
    parameters: {
      type: "object",
      properties: {
        specialist: { type: "string", description: "Specialist name", enum: specialistNames },
        task: { type: "string", description: "Self-contained task for the specialist" },
      },
      required: ["specialist", "task"],
    },
    async execute(args) {
      const to = String(args.specialist)
      const task = String(args.task)
      bus.emit({ type: "delegate", from: orchestrator.name, to, task })
      const text = await runSpecialist(to, task)
      return { title: `delegate → ${to}`, output: text }
    },
  }

  const delegateParallelTool: Tool = {
    name: "delegate_parallel",
    description: "Delegate several INDEPENDENT tasks to specialists at once; results return together.",
    parameters: {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          description: "List of {specialist, task} to run concurrently.",
          items: {
            type: "object",
            properties: {
              specialist: { type: "string", enum: specialistNames },
              task: { type: "string" },
            },
            required: ["specialist", "task"],
          },
        },
      },
      required: ["tasks"],
    },
    async execute(args) {
      const tasks = (Array.isArray(args.tasks) ? args.tasks : []) as { specialist: string; task: string }[]
      if (!tasks.length) return { title: "delegate_parallel", output: "No tasks provided." }
      for (const t of tasks)
        bus.emit({
          type: "delegate",
          from: orchestrator.name,
          to: String(t.specialist),
          task: String(t.task),
        })
      const results = await Promise.all(tasks.map((t) => runSpecialist(String(t.specialist), String(t.task))))
      const combined = tasks.map((t, i) => `### ${t.specialist}\n${results[i]}`).join("\n\n")
      return { title: `delegate_parallel ×${tasks.length}`, output: combined }
    },
  }

  const handoffTool: Tool = {
    name: "handoff",
    description: "Hand the task to a specialist for tight iteration; its answer becomes the response.",
    parameters: {
      type: "object",
      properties: {
        specialist: { type: "string", enum: specialistNames },
        task: { type: "string" },
      },
      required: ["specialist", "task"],
    },
    async execute(args) {
      const to = String(args.specialist)
      bus.emit({ type: "handoff", from: orchestrator.name, to })
      const text = await runSpecialist(to, String(args.task))
      return { title: `handoff → ${to}`, output: text }
    },
  }

  bus.emit({ type: "agent.start", agent: orchestrator.name, role: orchestrator.role })
  const messages: Message[] = [
    { role: "system", content: `${orchestrator.systemPrompt}\n\nYour specialists:\n${rosterDoc}` },
    { role: "user", content: opts.task },
  ]
  const result = await runAgent({
    provider: opts.provider,
    model: orchestrator.model ?? opts.model,
    messages,
    tools: [delegateTool, delegateParallelTool, handoffTool],
    impressionKey: opts.impressionKey,
    signal: opts.signal,
    maxTurns: opts.maxTurns ?? ORCH_MAX_TURNS,
    sessionId: orchestrator.name,
    bus,
  })
  bus.emit({ type: "agent.end", agent: orchestrator.name, summary: result.text.slice(0, 200) })

  return { text: result.text, agentsInvoked: [...invoked] }
}
