import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { discoverSkills } from "../src/loader.js";

describe("discoverSkills", () => {
  it("loads claude SKILL.md and codex AGENTS.md", async () => {
    const root = await mkdtemp(join(tmpdir(), "anomalithic-skills-"));
    const claudeDir = join(root, "brainstorm");
    const codexDir = join(root, "deploy");
    await mkdir(claudeDir, { recursive: true });
    await mkdir(codexDir, { recursive: true });
    await writeFile(
      join(claudeDir, "SKILL.md"),
      "---\nname: brainstorming\ndescription: explore ideas\n---\n\nDo the brainstorm.",
    );
    await writeFile(join(codexDir, "AGENTS.md"), "# Deploy agent\n\nDeploys things.");

    const skills = await discoverSkills([root]);
    const byName = Object.fromEntries(skills.map((s) => [s.name, s]));

    expect(byName.brainstorming?.source).toBe("claude");
    expect(byName.brainstorming?.description).toBe("explore ideas");
    expect(await byName.brainstorming?.loadBody()).toContain("Do the brainstorm.");
    expect(byName.deploy?.source).toBe("codex");
    expect(byName.deploy?.description).toBe("Deploy agent");
  });
});
