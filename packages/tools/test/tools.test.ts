import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test, vi } from "vitest"
import { builtinTools, fsTools, webFetchTool } from "../src/index.js"

const ctx = { sessionId: "t" }

describe("fsTools", () => {
  test("writes, reads, and lists within the workspace", async () => {
    const root = await mkdtemp(join(tmpdir(), "anom-"))
    try {
      const [read, write, list] = fsTools(root)
      await write!.execute({ path: "note.txt", content: "hello" }, ctx)
      expect(await readFile(join(root, "note.txt"), "utf8")).toBe("hello")
      const r = await read!.execute({ path: "note.txt" }, ctx)
      expect(r.output).toBe("hello")
      const l = await list!.execute({ path: "." }, ctx)
      expect(l.output).toContain("note.txt")
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  test("refuses path traversal outside the workspace", async () => {
    const root = await mkdtemp(join(tmpdir(), "anom-"))
    try {
      const [read] = fsTools(root)
      await expect(read!.execute({ path: "../../etc/passwd" }, ctx)).rejects.toThrow(/escapes/)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

describe("webFetchTool", () => {
  afterEach(() => vi.restoreAllMocks())
  test("reduces HTML to text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        headers: { get: () => "text/html" },
        async text() {
          return "<html><body><h1>Hi</h1><script>x()</script></body></html>"
        },
      })),
    )
    const out = await webFetchTool().execute({ url: "https://example.com" }, ctx)
    expect(out.output).toContain("Hi")
    expect(out.output).not.toContain("script")
  })
  test("rejects non-http URLs", async () => {
    await expect(webFetchTool().execute({ url: "file:///etc/passwd" }, ctx)).rejects.toThrow()
  })
})

describe("builtinTools", () => {
  test("includes fs by default and gates web/shell behind options", () => {
    const base = builtinTools({ workspaceRoot: "." })
    expect(base.map((t) => t.name)).toEqual(["read_file", "write_file", "list_dir"])
    const full = builtinTools({ workspaceRoot: ".", web: true, shell: true })
    expect(full.map((t) => t.name)).toContain("web_fetch")
    expect(full.map((t) => t.name)).toContain("shell")
  })
})
