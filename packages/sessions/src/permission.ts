export type PermissionAction = "allow" | "deny" | "ask"

export interface PermissionRule {
  /** Tool or capability name, e.g. "shell", "write_file", or "*". */
  permission: string
  /** Glob-ish value pattern; "*" matches anything. */
  pattern: string
  action: PermissionAction
}

export type Ruleset = PermissionRule[]

function matches(pattern: string, value: string): boolean {
  if (pattern === "*" || pattern === value) return true
  if (pattern.endsWith("*")) return value.startsWith(pattern.slice(0, -1))
  return false
}

/**
 * Evaluates a ruleset for a (permission, value) pair. The most specific matching
 * rule wins (exact permission over "*"); ties resolve to the last rule. Defaults to
 * "ask" when nothing matches, so unknown actions are surfaced, not silently allowed.
 */
export function evaluate(rules: Ruleset, permission: string, value = "*"): PermissionAction {
  let decision: PermissionAction = "ask"
  let bestScore = -1
  for (const rule of rules) {
    const permMatch = rule.permission === "*" || rule.permission === permission
    if (!permMatch || !matches(rule.pattern, value)) continue
    const score = (rule.permission === permission ? 2 : 0) + (rule.pattern !== "*" ? 1 : 0)
    if (score >= bestScore) {
      bestScore = score
      decision = rule.action
    }
  }
  return decision
}

/**
 * Narrows a parent ruleset for a subagent: the child inherits the parent's rules and
 * can be further restricted, but can never be granted a capability the parent denies.
 * Any parent "deny" is appended last so it dominates.
 */
export function deriveSubagentRuleset(parent: Ruleset, childExtra: Ruleset = []): Ruleset {
  const denies = parent.filter((r) => r.action === "deny")
  return [...parent, ...childExtra, ...denies]
}
