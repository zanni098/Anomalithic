import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { discoverPlugins, loadPluginSkills, pluginHooks } from "../src/loader.js";

describe("plugins", () => {
  it("discovers a plugin and loads its bundled skill + hook", async () => {
    const root = await mkdtemp(join(tmpdir(), "anomalithic-plug-"));
    const plug = join(root, "demo-plugin");
    await mkdir(join(plug, "skills", "greet"), { recursive: true });
    await writeFile(
      join(plug, "anomalithic.plugin.json"),
      JSON.stringify({
        name: "demo-plugin",
        version: "0.1.0",
        skills: ["skills"],
        hooks: [{ event: "PreToolUse", command: "echo", args: ["ok"] }],
      }),
    );
    await writeFile(
      join(plug, "skills", "greet", "SKILL.md"),
      "---\nname: greet\ndescription: say hi\n---\n\nSay hello.",
    );

    const plugins = await discoverPlugins([root]);
    expect(plugins).toHaveLength(1);
    expect(plugins[0]?.manifest.name).toBe("demo-plugin");

    const plugin = plugins[0];
    if (!plugin) throw new Error("expected a plugin");
    const skills = await loadPluginSkills(plugin);
    expect(skills[0]?.name).toBe("greet");
    const hooks = pluginHooks(plugin);
    expect(hooks[0]?.event).toBe("PreToolUse");
  });
});
