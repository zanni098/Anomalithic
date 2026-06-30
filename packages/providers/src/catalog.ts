import type { Provider } from "@anomalithic/runtime"
import { anthropicProvider } from "./anthropic.js"
import { freeModelCandidates, freeRouterProvider } from "./free-router.js"
import { mockProvider } from "./mock.js"
import { openAICompatibleProvider } from "./openai-compatible.js"

export type ProviderId = "mock" | "free-router" | "openrouter" | "openai" | "gemini" | "ollama" | "anthropic"

/** A sensible default model per provider when the user doesn't pass `-m`. */
export const DEFAULT_MODELS: Record<ProviderId, string> = {
  mock: "mock",
  "free-router": "auto", // resolved at runtime via pickFreeModel()
  openrouter: "openrouter/auto",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
  ollama: "llama3.1",
  anthropic: "claude-sonnet-4-6",
}

/** Curated fallbacks if the live OpenRouter free list can't be fetched. */
const FREE_MODEL_FALLBACKS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "deepseek/deepseek-chat:free",
]

const OPENROUTER_BASE = "https://openrouter.ai/api/v1"
const OPENROUTER_HEADERS = {
  "HTTP-Referer": "https://anomalithic.vercel.app",
  "X-Title": "Anomalithic",
}

export interface ProviderEnv {
  ANOMALITHIC_PROVIDER?: string
  OPENROUTER_API_KEY?: string
  OPENAI_API_KEY?: string
  OPENAI_BASE_URL?: string
  GOOGLE_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  OLLAMA_BASE_URL?: string
}

/** Builds a provider instance by id, reading keys/endpoints from `env`. */
export function buildProvider(id: ProviderId, env: ProviderEnv = process.env): Provider {
  switch (id) {
    case "mock":
      return mockProvider()
    case "anthropic":
      return anthropicProvider({ apiKey: env.ANTHROPIC_API_KEY ?? "" })
    case "openai":
      return openAICompatibleProvider({
        id: "openai",
        name: "OpenAI",
        baseUrl: env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
        apiKey: env.OPENAI_API_KEY,
      })
    case "gemini":
      return openAICompatibleProvider({
        id: "gemini",
        name: "Google Gemini",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
        apiKey: env.GOOGLE_API_KEY,
      })
    case "ollama":
      return openAICompatibleProvider({
        id: "ollama",
        name: "Ollama",
        baseUrl: env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
        apiKey: "ollama",
      })
    case "free-router":
      return freeRouterProvider(env.OPENROUTER_API_KEY)
    case "openrouter":
      return openAICompatibleProvider({
        id: "openrouter",
        name: "OpenRouter",
        baseUrl: OPENROUTER_BASE,
        apiKey: env.OPENROUTER_API_KEY,
        headers: OPENROUTER_HEADERS,
      })
  }
}

/**
 * Picks a free OpenRouter model id (suffix `:free`), preferring well-known capable
 * ones. Falls back to a curated list when the live catalog can't be fetched. This is
 * what makes the Free Models Router a zero-cost default.
 */
export async function pickFreeModel(provider: Provider): Promise<string> {
  const candidates = await freeModelCandidates(provider)
  return candidates[0] ?? (FREE_MODEL_FALLBACKS[0] as string)
}

/**
 * Chooses a provider from the environment: explicit `ANOMALITHIC_PROVIDER` wins,
 * otherwise the first provider with a configured key — preferring the zero-cost
 * Free Models Router. Returns `mock` when nothing is configured.
 */
export function resolveDefaultProviderId(env: ProviderEnv = process.env): ProviderId {
  const explicit = env.ANOMALITHIC_PROVIDER?.trim() as ProviderId | undefined
  if (explicit) return explicit
  if (env.OPENROUTER_API_KEY) return "free-router"
  if (env.ANTHROPIC_API_KEY) return "anthropic"
  if (env.OPENAI_API_KEY) return "openai"
  if (env.GOOGLE_API_KEY) return "gemini"
  if (env.OLLAMA_BASE_URL) return "ollama"
  return "mock"
}
