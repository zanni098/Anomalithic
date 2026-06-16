export type Decision = "allow" | "deny" | "ask";

export interface PermissionRules {
  allow?: string[];
  deny?: string[];
  ask?: string[];
  default?: Decision;
}

function globToRegExp(glob: string): RegExp {
  const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^\\s]*");
  return new RegExp(`^${escaped}$`);
}

function matchesAny(patterns: string[] | undefined, action: string): boolean {
  if (!patterns) return false;
  return patterns.some((pattern) => globToRegExp(pattern).test(action));
}

/** Evaluates whether an action is allowed, denied, or needs confirmation. */
export class PermissionPolicy {
  constructor(private readonly rules: PermissionRules) {}

  evaluate(action: string): Decision {
    if (matchesAny(this.rules.deny, action)) return "deny";
    if (matchesAny(this.rules.allow, action)) return "allow";
    if (matchesAny(this.rules.ask, action)) return "ask";
    return this.rules.default ?? "ask";
  }
}
