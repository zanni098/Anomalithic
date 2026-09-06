import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import type { RuntimeEvent } from "@anomalithic/runtime"
import { startRuntimeServer } from "@anomalithic/server"
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest"
import { createClient } from "../src/index.js"

let server: Server
let client: ReturnType<typeof createClient>

beforeAll(async () => {
  server = await startRuntimeServer(0, { workspaceRoot: process.cwd() })
  const port = (server.address() as AddressInfo).port
  client = createClient(`http://127.0.0.1:${port}`)
})

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("createClient (against a live runtime server)", () => {
  test("delivers the final event without a trailing newline", async () => {
    const event = { type: "done", text: "", finishReason: "stop" } as RuntimeEvent
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            new ReadableStream<Uint8Array>({
              start(controller) {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}`))
                controller.close()
              },
            }),
          ),
      ),
    )
    const events: RuntimeEvent[] = []
    await createClient("http://example.test").run({ prompt: "x" }, (value) => events.push(value))
    expect(events).toEqual([event])
  })

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
