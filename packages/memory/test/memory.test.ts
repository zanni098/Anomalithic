import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseFact, serializeFact } from "../src/frontmatter.js";
import { recall } from "../src/recall.js";
import { FileMemoryStore } from "../src/store.js";
import type { MemoryFact } from "../src/types.js";

const fact = (over: Partial<MemoryFact>): MemoryFact => ({
  name: "test-fact",
  description: "a description",
  type: "project",
  created: "2026-06-16",
  body: "body text",
  links: [],
  ...over,
});

describe("memory", () => {
  it("round-trips frontmatter and extracts links", () => {
    const parsed = parseFact(serializeFact(fact({ body: "see [[other-fact]] for more" })));
    expect(parsed.name).toBe("test-fact");
    expect(parsed.type).toBe("project");
    expect(parsed.links).toEqual(["other-fact"]);
  });

  it("saves, lists, gets, and indexes facts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anomalithic-mem-"));
    const store = new FileMemoryStore(dir);
    await store.save(fact({ name: "alpha", description: "first" }));
    await store.save(fact({ name: "beta", description: "second" }));

    const all = await store.list();
    expect(all.map((f) => f.name).sort()).toEqual(["alpha", "beta"]);
    expect((await store.get("alpha"))?.description).toBe("first");

    const index = await readFile(join(dir, "MEMORY.md"), "utf8");
    expect(index).toContain("[Alpha](alpha.md) — first");
  });

  it("ranks the relevant fact first in recall", () => {
    const facts = [
      fact({ name: "cooking", description: "recipes", body: "pasta and tomato sauce" }),
      fact({ name: "agents", description: "ai runtime", body: "model providers and tools" }),
    ];
    const out = recall(facts, "which provider models do agents use", 1);
    expect(out[0]?.name).toBe("agents");
  });
});
