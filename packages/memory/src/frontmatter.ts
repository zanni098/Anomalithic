import type { MemoryFact, MemoryType } from "./types.js";

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

function parseLinks(body: string): string[] {
  const links: string[] = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let match = re.exec(body);
  while (match !== null) {
    const name = match[1]?.trim();
    if (name && !links.includes(name)) links.push(name);
    match = re.exec(body);
  }
  return links;
}

function asType(value: string | undefined): MemoryType {
  if (value === "user" || value === "project" || value === "feedback" || value === "reference") {
    return value;
  }
  return "reference";
}

/** Parses a markdown fact file (frontmatter + body) into a MemoryFact. */
export function parseFact(markdown: string): MemoryFact {
  const match = FRONTMATTER_RE.exec(markdown.trim());
  const data: Record<string, string> = {};
  let body = markdown.trim();
  if (match) {
    body = (match[2] ?? "").trim();
    for (const line of (match[1] ?? "").split("\n")) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      if (key) data[key] = line.slice(idx + 1).trim();
    }
  }
  return {
    name: data.name ?? "untitled",
    description: data.description ?? "",
    type: asType(data.type),
    created: data.created ?? "",
    body,
    links: parseLinks(body),
  };
}

/** Serializes a MemoryFact back into a markdown file with frontmatter. */
export function serializeFact(fact: MemoryFact): string {
  return [
    "---",
    `name: ${fact.name}`,
    `description: ${fact.description}`,
    `type: ${fact.type}`,
    `created: ${fact.created}`,
    "---",
    "",
    fact.body.trim(),
    "",
  ].join("\n");
}
