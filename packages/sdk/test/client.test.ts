import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import type { RuntimeEvent } from "@anomalithic/runtime"
import { startRuntimeServer } from "@anomalithic/server"
import { afterAll, beforeAll, describe, expect, test } from "vitest"
import { createClient } from "../src/index.js"

let server: Server
let client: ReturnType<typeof createClient>

beforeAll(async () => {
  server = await startRuntimeServer(0, { workspaceRoot: process.cwd() })
  const port = (server.address() as AddressInfo).port
  client = createClient(`http://127.0.0.1:${port}`)
})

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))

describe("createClient (against a live runtime server)", () => {
  test("health and agents", async () => {
    expect((await client.health()).ok).toBe(true)
    const agents = await client.agents()
    expect(agents.some((a) => a.role === "orchestrator")).toBe(true)
  })

  test("swarm streams trace events to the callback", async () => {
    const events: RuntimeEvent[] = []
    await client.swarm({ goal: "do a thing", provider: "mock" }, (e) => events.push(e))
    const types = events.map((e) => e.type)
    expect(types).toContain("delegate")
    expect(types).toContain("done")
  })
})
