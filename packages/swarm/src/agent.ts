/** Declarative definition of an agent in the swarm (OpenSwarm-style roster entry). */
export interface AgentDefinition {
  name: string
  description: string
  role: "orchestrator" | "specialist"
  systemPrompt: string
  /** Optional per-agent model override (else the swarm default). */
  model?: string
  /** Names of built-in tools this agent should receive (resolved by the host). */
  toolNames?: string[]
  /** Display color for the UI trace. */
  color?: string
}

/** Looks an agent up by case-insensitive name. */
export function findAgent(agents: AgentDefinition[], name: string): AgentDefinition | undefined {
  const lower = name.toLowerCase()
  return agents.find((a) => a.name.toLowerCase() === lower)
}
