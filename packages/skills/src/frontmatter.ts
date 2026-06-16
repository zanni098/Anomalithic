export interface Frontmatter {
  data: Record<string, string>;
  body: string;
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

/** Parses a leading `---` fenced block of simple `key: value` lines. */
export function parseFrontmatter(markdown: string): Frontmatter {
  const match = FRONTMATTER_RE.exec(markdown);
  if (!match) return { data: {}, body: markdown };

  const data: Record<string, string> = {};
  for (const line of (match[1] ?? "").split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    if (key) data[key] = line.slice(idx + 1).trim();
  }
  return { data, body: (match[2] ?? "").trim() };
}
