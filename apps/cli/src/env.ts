import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

/**
 * Minimal `.env` loader (no dependency). Reads KEY=VALUE lines from the first
 * existing path and sets them on `process.env` without overwriting existing vars.
 */
export function loadDotenv(paths: string[] = [resolve(process.cwd(), ".env")]): void {
  for (const path of paths) {
    if (!existsSync(path)) continue
    const text = readFileSync(path, "utf8")
    for (const rawLine of text.split("\n")) {
      const line = rawLine.trim()
      if (!line || line.startsWith("#")) continue
      const eq = line.indexOf("=")
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      let value = line.slice(eq + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (key && process.env[key] === undefined) process.env[key] = value
    }
    return
  }
}
