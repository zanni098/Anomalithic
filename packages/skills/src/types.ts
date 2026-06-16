/** A unified skill loaded from either a Claude SKILL.md or a Codex AGENTS.md. */
export interface Skill {
  name: string;
  description: string;
  source: "claude" | "codex";
  path: string;
  /** Lazily reads the skill body so large skill files are not all held in memory. */
  loadBody: () => Promise<string>;
}
