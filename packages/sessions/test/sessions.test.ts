import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, test } from "vitest"
import { type Ruleset, SessionStore, deriveSubagentRuleset, evaluate } from "../src/index.js"

describe("SessionStore", () => {
  test("creates, persists, resumes, and lists sessions", async () => {
    const dir = await mkdtemp(join(tmpdir(), "anom-sess-"))
    try {
      const store = new SessionStore(dir)
      const s = await store.create({ title: "Demo", messages: [{ role: "user", content: "hi" }] })
      await store.appendMessages(s.id, [{ role: "assistant", content: "hello" }])

      // A fresh store instance must resume from disk.
      const reopened = new SessionStore(dir)
      const got = await reopened.get(s.id)
      expect(got?.messages).toHaveLength(2)
      expect(got?.title).toBe("Demo")
      expect(await reopened.list()).toHaveLength(1)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

describe("permission evaluate", () => {
  const rules: Ruleset = [
    { permission: "*", pattern: "*", action: "ask" },
    { permission: "read_file", pattern: "*", action: "allow" },
    { permission: "shell", pattern: "*", action: "deny" },
  ]
  test("matches the most specific rule", () => {
    expect(evaluate(rules, "read_file")).toBe("allow")
    expect(evaluate(rules, "shell")).toBe("deny")
    expect(evaluate(rules, "unknown")).toBe("ask")
  })
})

describe("deriveSubagentRuleset", () => {
  test("a parent deny cannot be overridden by a child allow", () => {
    const parent: Ruleset = [{ permission: "shell", pattern: "*", action: "deny" }]
    const child: Ruleset = [{ permission: "shell", pattern: "*", action: "allow" }]
    const derived = deriveSubagentRuleset(parent, child)
    expect(evaluate(derived, "shell")).toBe("deny")
  })
})
