import { fileURLToPath } from "node:url";
import { discoverSkills } from "@anomalithic/skills";
import { describe, expect, it } from "vitest";

// The repo-root `skills/` directory ships built-in skills with the runtime.
const repoSkillsDir = fileURLToPath(new URL("../../../skills", import.meta.url));

describe("built-in skills", () => {
  it("ships the loop-engineering skill as a claude SKILL.md", async () => {
    const skills = await discoverSkills([repoSkillsDir]);
    const loop = skills.find((s) => s.name === "loop-engineering");

    expect(loop).toBeDefined();
    expect(loop?.source).toBe("claude");
    expect(loop?.description.toLowerCase()).toContain("loop");

    const body = (await loop?.loadBody()) ?? "";
    expect(body).toContain("PLAN");
    expect(body).toContain("VERIFY");
  });
});
