import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseFact, serializeFact } from "./frontmatter.js";
import type { MemoryFact } from "./types.js";

const INDEX_FILE = "MEMORY.md";

function titleize(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((word) => {
      if (word.length === 0) return word;
      const first = word[0] ?? "";
      return first.toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/** File-backed memory store: one markdown file per fact + a MEMORY.md index. */
export class FileMemoryStore {
  constructor(private readonly rootDir: string) {}

  async list(): Promise<MemoryFact[]> {
    await this.ensureDir();
    const entries = await readdir(this.rootDir);
    const facts: MemoryFact[] = [];
    for (const entry of entries) {
      if (!entry.endsWith(".md") || entry === INDEX_FILE) continue;
      facts.push(parseFact(await readFile(join(this.rootDir, entry), "utf8")));
    }
    return facts;
  }

  async get(name: string): Promise<MemoryFact | undefined> {
    try {
      return parseFact(await readFile(join(this.rootDir, `${name}.md`), "utf8"));
    } catch {
      return undefined;
    }
  }

  async save(fact: MemoryFact): Promise<void> {
    await this.ensureDir();
    await writeFile(join(this.rootDir, `${fact.name}.md`), serializeFact(fact), "utf8");
    await this.rebuildIndex();
  }

  async remove(name: string): Promise<void> {
    await rm(join(this.rootDir, `${name}.md`), { force: true });
    await this.rebuildIndex();
  }

  async rebuildIndex(): Promise<void> {
    const facts = await this.list();
    facts.sort((a, b) => a.name.localeCompare(b.name));
    const lines = facts.map((f) => `- [${titleize(f.name)}](${f.name}.md) — ${f.description}`);
    await writeFile(join(this.rootDir, INDEX_FILE), `${lines.join("\n")}\n`, "utf8");
  }

  private async ensureDir(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
  }
}
