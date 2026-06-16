import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { parseFrontmatter } from "./frontmatter.js";
import type { Skill } from "./types.js";

const SKIP = new Set(["node_modules", "dist", ".git"]);
const MAX_DEPTH = 6;

async function walk(dir: string, depth: number, out: string[]): Promise<void> {
  if (depth > MAX_DEPTH) return;
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!SKIP.has(entry.name)) await walk(join(dir, entry.name), depth + 1, out);
      } else if (entry.name === "SKILL.md" || entry.name === "AGENTS.md") {
        out.push(join(dir, entry.name));
      }
    }
  } catch {
    // unreadable directory — skip
  }
}

function firstLine(text: string): string {
  for (const line of text.split("\n")) {
    const trimmed = line.replace(/^#+\s*/, "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

/** Discovers Claude (SKILL.md) and Codex (AGENTS.md) skills under the given dirs. */
export async function discoverSkills(dirs: string[]): Promise<Skill[]> {
  const files: string[] = [];
  for (const dir of dirs) await walk(dir, 0, files);

  const skills: Skill[] = [];
  for (const path of files) {
    const raw = await readFile(path, "utf8");
    const parentName = basename(dirname(path));
    if (basename(path) === "SKILL.md") {
      const { data, body } = parseFrontmatter(raw);
      skills.push({
        name: data.name ?? parentName,
        description: data.description ?? "",
        source: "claude",
        path,
        loadBody: async () => body,
      });
    } else {
      skills.push({
        name: parentName,
        description: firstLine(raw),
        source: "codex",
        path,
        loadBody: () => readFile(path, "utf8"),
      });
    }
  }
  return skills;
}
