import type { Provider, ProviderRequest, StreamEvent } from "@anomalithic/runtime"
import { openAICompatibleProvider } from "./openai-compatible.js"

const OPENROUTER_BASE = "https://openrouter.ai/api/v1"
const OPENROUTER_HEADERS = {
  "HTTP-Referer": "https://anomalithic.vercel.app",
  "X-Title": "Anomalithic",
}

/** Preference order applied to the live free-model list (most capable first). */
const PREFERRED = ["llama-3.3", "llama-3.1-70b", "qwen-2.5-72b", "qwen3", "gemini-2.0-flash", "deepseek"]

/** Curated fallbacks if the live OpenRouter free list can't be fetched. */
const FALLBACKS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "deepseek/deepseek-chat:free",
  "mistralai/mistral-7b-instruct:free",
]

const MAX_CANDIDATES = 6

function isRetryable(error: string): boolean {
  return (
    /\b(429|408|409|5\d\d)\b/.test(error) || /rate.?limit|temporarily|overloaded|unavailable/i.test(error)
  )
}

/** Orders the free candidate models: preferred live ones, then the rest, then fallbacks. */
export async function freeModelCandidates(base: Provider): Promise<string[]> {
  const live = ((await base.models?.()) ?? []).filter((m) => m.endsWith(":free"))
  const preferred = PREFERRED.flatMap((p) => live.filter((m) => m.includes(p)))
  const ordered = [...new Set([...preferred, ...live, ...FALLBACKS])]
  return ordered.slice(0, MAX_CANDIDATES)
}

/**
 * The Free Models Router: a provider that tries free OpenRouter models in
 * preference order and **routes around** ones that are rate-limited or failing
 * before producing output. Zero-cost default for first-run usage.
 */
export function freeRouterProvider(apiKey?: string): Provider {
  const base = openAICompatibleProvider({
    id: "free-router",
    name: "Free Models Router",
    baseUrl: OPENROUTER_BASE,
    apiKey,
    headers: OPENROUTER_HEADERS,
  })

  return {
    id: "free-router",
    name: "Free Models Router",
    models: () => base.models?.() ?? Promise.resolve([]),
    async *stream(req: ProviderRequest): AsyncIterable<StreamEvent> {
      // If the caller pinned a concrete model (not the "auto" sentinel), respect it.
      const candidates = req.model && req.model !== "auto" ? [req.model] : await freeModelCandidates(base)

      let lastError: StreamEvent | undefined
      for (const model of candidates) {
        let emittedContent = false
        for await (const ev of base.stream({ ...req, model })) {
          if (ev.type === "error" && !emittedContent && isRetryable(ev.error)) {
            lastError = ev
            break // route to the next free model
          }
          yield ev
          if (ev.type === "text_delta" || ev.type === "thinking_delta" || ev.type === "tool_call") {
            emittedContent = true
          }
          if (ev.type === "done") return
        }
        if (emittedContent) return
      }
      yield lastError ?? { type: "error", error: "No free model is currently available. Try again shortly." }
    },
  }
}
