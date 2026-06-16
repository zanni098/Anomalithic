import type { MemoryFact } from "./types.js";

/** Pluggable embedder so lexical recall can be swapped for semantic recall later. */
export interface Embedder {
  embed(text: string): Promise<number[]>;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

/** Deterministic lexical recall by token overlap — the default until embeddings land. */
export function recall(facts: MemoryFact[], query: string, k = 5): MemoryFact[] {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return facts.slice(0, k);

  const scored = facts.map((fact) => {
    const tokens = tokenize(`${fact.name} ${fact.description} ${fact.body}`);
    let overlap = 0;
    for (const token of tokens) {
      if (queryTokens.has(token)) overlap += 1;
    }
    const score = tokens.length > 0 ? overlap / Math.sqrt(tokens.length) : 0;
    return { fact, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.fact);
}
