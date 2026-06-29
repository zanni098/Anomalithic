import { readFile, readdir, writeFile } from "node:fs/promises"
import { isAbsolute, relative, resolve } from "node:path"
import type { Tool } from "@anomalithic/runtime"

const MAX_READ = 100_000

/** Resolves `p` under `root`, refusing paths that escape the workspace. */
function resolveWithin(root: string, p: string): string {
  const abs = isAbsolute(p) ? p : resolve(root, p)
  const rel = relative(root, abs)
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Path escapes the workspace root: ${p}`)
  }
  return abs
}

/** Built-in filesystem tools confined to a single workspace `root`. */
export function fsTools(root: string): Tool[] {
  return [
    {
      name: "read_file",
      description: "Read a UTF-8 text file within the workspace.",
      parameters: {
        type: "object",
        properties: { path: { type: "string", description: "Path relative to the workspace root." } },
        required: ["path"],
      },
      async execute(args) {
        const path = resolveWithin(root, String(args.path))
        const content = await readFile(path, "utf8")
        const truncated = content.length > MAX_READ
        return {
          title: `read ${args.path}`,
          output: truncated ? `${content.slice(0, MAX_READ)}\n…[truncated]` : content,
          metadata: { bytes: content.length, truncated },
        }
      },
    },
    {
      name: "write_file",
      description: "Write a UTF-8 text file within the workspace (creates or overwrites).",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path relative to the workspace root." },
          content: { type: "string", description: "File contents." },
        },
        required: ["path", "content"],
      },
      async execute(args) {
        const path = resolveWithin(root, String(args.path))
        await writeFile(path, String(args.content ?? ""), "utf8")
        return {
          title: `write ${args.path}`,
          output: `Wrote ${String(args.content ?? "").length} bytes to ${args.path}`,
        }
      },
    },
    {
      name: "list_dir",
      description: "List entries of a directory within the workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Directory path relative to the workspace root." },
        },
        required: ["path"],
      },
      async execute(args) {
        const path = resolveWithin(root, String(args.path ?? "."))
        const entries = await readdir(path, { withFileTypes: true })
        const lines = entries.map((e) => `${e.isDirectory() ? "dir " : "file"}  ${e.name}`)
        return { title: `ls ${args.path ?? "."}`, output: lines.join("\n") || "(empty)" }
      },
    },
  ]
}
