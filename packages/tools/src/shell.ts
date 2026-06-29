import { exec } from "node:child_process"
import { promisify } from "node:util"
import type { Tool } from "@anomalithic/runtime"

const execAsync = promisify(exec)
const DEFAULT_TIMEOUT_MS = 30_000
const MAX_OUTPUT = 30_000

export interface ShellToolOptions {
  /** Working directory for commands. */
  cwd: string
  /** When set, only commands whose first token is in this list may run. */
  allow?: string[]
  timeoutMs?: number
}

/**
 * A guarded shell tool. Confined to `cwd`; if `allow` is provided, only those
 * leading commands are permitted (a coarse safety gate for unattended runs).
 */
export function shellTool(opts: ShellToolOptions): Tool {
  return {
    name: "shell",
    description: "Run a shell command in the workspace and return combined stdout/stderr.",
    parameters: {
      type: "object",
      properties: { command: { type: "string", description: "The command line to execute." } },
      required: ["command"],
    },
    async execute(args, ctx) {
      const command = String(args.command ?? "").trim()
      if (!command) throw new Error("command is required")
      if (opts.allow) {
        const head = command.split(/\s+/)[0] ?? ""
        if (!opts.allow.includes(head)) {
          return {
            title: command,
            output: `Blocked: '${head}' is not in the allowed command list.`,
            metadata: { blocked: true },
          }
        }
      }
      try {
        const { stdout, stderr } = await execAsync(command, {
          cwd: opts.cwd,
          timeout: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
          signal: ctx.signal,
          maxBuffer: MAX_OUTPUT * 2,
        })
        const out = `${stdout}${stderr ? `\n[stderr]\n${stderr}` : ""}`.trim()
        return { title: command, output: out.slice(0, MAX_OUTPUT) || "(no output)" }
      } catch (err) {
        const e = err as { stdout?: string; stderr?: string; message?: string }
        const detail = e.stderr || e.stdout || e.message || String(err)
        return {
          title: command,
          output: `Command failed: ${detail.slice(0, MAX_OUTPUT)}`,
          metadata: { failed: true },
        }
      }
    },
  }
}
