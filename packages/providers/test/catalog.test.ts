import type { Provider } from "@anomalithic/runtime"
import { describe, expect, test } from "vitest"
import { buildProvider, pickFreeModel, resolveDefaultProviderId } from "../src/catalog.js"

describe("resolveDefaultProviderId", () => {
  test("explicit ANOMALITHIC_PROVIDER wins", () => {
    expect(resolveDefaultProviderId({ ANOMALITHIC_PROVIDER: "gemini", OPENROUTER_API_KEY: "x" })).toBe(
      "gemini",
    )
  })
  test("prefers the zero-cost free router when a key is present", () => {
    expect(resolveDefaultProviderId({ OPENROUTER_API_KEY: "x", ANTHROPIC_API_KEY: "y" })).toBe("free-router")
  })
  test("falls back through paid providers then to mock", () => {
    expect(resolveDefaultProviderId({ ANTHROPIC_API_KEY: "y" })).toBe("anthropic")
    expect(resolveDefaultProviderId({ OPENAI_API_KEY: "y" })).toBe("openai")
    expect(resolveDefaultProviderId({})).toBe("mock")
  })
})

describe("buildProvider", () => {
  test("constructs each provider id", () => {
    for (const id of ["mock", "free-router", "openai", "gemini", "ollama", "anthropic"] as const) {
      const p = buildProvider(id, { ANTHROPIC_API_KEY: "k", OPENROUTER_API_KEY: "k" })
      expect(p.id === id || p.id === "free-router").toBeTruthy()
    }
  })
})

describe("pickFreeModel", () => {
  test("prefers a known-capable free model", async () => {
    const fake: Provider = {
      id: "x",
      name: "X",
      async models() {
        return ["foo/bar:free", "meta-llama/llama-3.3-70b-instruct:free", "paid/model"]
      },
      async *stream() {},
    }
    expect(await pickFreeModel(fake)).toBe("meta-llama/llama-3.3-70b-instruct:free")
  })
  test("falls back to a curated model when no free models are listed", async () => {
    const fake: Provider = {
      id: "x",
      name: "X",
      async models() {
        return []
      },
      async *stream() {},
    }
    expect(await pickFreeModel(fake)).toContain(":free")
  })
})
