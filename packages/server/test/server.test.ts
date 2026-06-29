import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { startRuntimeServer } from "../src/server.js"

let server: Server
let base: string

beforeAll(async () => {
  server = await startRuntimeServer(0, { workspaceRoot: process.cwd() })
  const port = (server.address() as AddressInfo).port
  base = `http://127.0.0.1:${port}`
})

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))

/** Collects SSE event objects from a streaming response body. */
async function collectSSE(res: Response): Promise<any[]> {
  const reader = res.body!.getReader()
  const dec = new TextDecoder()
  let buf = ""
  const events: any[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    let nl = buf.indexOf("\n")
    while (nl !== -1) {
      const line = buf.slice(0, nl).trim()
      buf = buf.slice(nl + 1)
      nl = buf.indexOf("\n")
      if (line.startsWith("data:")) events.push(JSON.parse(line.slice(5).trim()))
    }
  }
  return events
}

describe("runtime server", () => {
  test("GET /health", async () => {
    const res = await fetch(`${base}/health`)
    expect(await res.json()).toMatchObject({ ok: true })
  })

  test("GET /agents returns the roster without system prompts", async () => {
    const { agents } = (await (await fetch(`${base}/agents`)).json()) as { agents: any[] }
    expect(agents.find((a) => a.role === "orchestrator")).toBeTruthy()
    expect(agents.length).toBeGreaterThanOrEqual(9)
    expect(agents[0].systemPrompt).toBeUndefined()
  })

  test("POST /swarm streams a traced run (mock provider)", async () => {
    const res = await fetch(`${base}/swarm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ goal: "summarize something", provider: "mock" }),
    })
    const events = await collectSSE(res)
    const types = events.map((e) => e.type)
    expect(types).toContain("agent.start")
    expect(types).toContain("delegate")
    expect(types).toContain("done")
  })
})
