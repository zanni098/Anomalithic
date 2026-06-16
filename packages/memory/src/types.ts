export type MemoryType = "user" | "project" | "feedback" | "reference";

/** A single atomic memory: one fact per file, with frontmatter metadata. */
export interface MemoryFact {
  name: string;
  description: string;
  type: MemoryType;
  /** ISO date (YYYY-MM-DD). */
  created: string;
  body: string;
  /** Names of related facts, parsed from [[links]] in the body. */
  links: string[];
}
