import type { Provider, StreamEvent } from "@anomalithic/runtime"
import { afterEach, describe, expect, test, vi } from "vitest"
import { freeModelCandidates, freeRouterProvider } from "../src/free-router.js"

afterEach(() => vi.restoreAllMocks())

const fakeBase = (free: string[]): Provider => ({
  id: "b",
  name: "B",
  async models() {
    return free
  },
  async *stream() {},
})

describe("freeModelCandidates", () => {
  test("orders preferred free models first and appends fallbacks", async () => {
    const cands = await freeModelCandidates(
      fakeBase(["x/qwen-2.5-72b-instruct:free", "y/llama-3.3-70b:free", "z/random:free", "paid/model"]),
    )
    expect(cands[0]).toContain("llama-3.3")
    expect(cands.every((m) => m.endsWith(":free"))).toBe(true)
    expect(cands.length).toBeLessThanOrEqual(6)
  })

  test("returns curated fallbacks when nothing is live", async () => {
    const cands = await freeModelCandidates(fakeBase([]))
    expect(cands.length).toBeGreaterThan(0)
    expect(cands.every((m) => m.endsWith(":free"))).toBe(true)
  })
})

/** Streams an SSE response; `payloads` are raw `data:` JSON strings. */
function sse(payloads: string[], ok = true, status = 200): Response {
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      const enc = new TextEncoder()
      for (const p of payloads) c.enqueue(enc.encode(`data: ${p}\n\n`))
      c.enqueue(enc.encode("data: [DONE]\n\n"))
      c.close()
    },
  })
  return {
    ok,
    status,
    body,
    async text() {
      return '{"error":{"code":429}}'
    },
  } as unknown as Response
}

describe("freeRouterProvider routing", () => {
  test("routes past a rate-limited model to the next free one", async () => {
    const calls: string[] = []
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        const model = JSON.parse(String(init?.body ?? "{}")).model as string
        calls.push(model)
        // First attempt: 429. Second attempt: a real answer.
        return calls.length === 1
          ? sse([], false, 429)
          : sse([JSON.stringify({ choices: [{ delta: { content: "ok" } }] })])
      }),
    )
    const router = freeRouterProvider("key")
    const events: StreamEvent[] = []
    for await (const e of router.stream({ model: "auto", messages: [{ role: "user", content: "hi" }] }))
      events.push(e)

    const text = events
      .filter((e) => e.type === "text_delta")
      .map((e) => (e as any).text)
      .join("")
    expect(text).toBe("ok")
    expect(calls.length).toBeGreaterThanOrEqual(2) // it tried again after the 429
    expect(events.some((e) => e.type === "error")).toBe(false)
  })
})
