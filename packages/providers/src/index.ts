export * from "./types.js";
export { collect } from "./collect.js";
export { MockProvider, type MockTurn } from "./mock.js";
export { AnthropicProvider, type AnthropicOptions } from "./anthropic.js";
export { OpenAIProvider, type OpenAIOptions } from "./openai.js";

import { AnthropicProvider } from "./anthropic.js";
import { MockProvider } from "./mock.js";
import { OpenAIProvider } from "./openai.js";
import type { Provider } from "./types.js";

export type ProviderKind = "anthropic" | "openai" | "google" | "mock";

/** Google Gemini speaks the OpenAI-compatible protocol at this base URL. */
const GOOGLE_OPENAI_BASE = "https://generativelanguage.googleapis.com/v1beta/openai";

export interface ProviderConfig {
  kind: ProviderKind;
  apiKey?: string;
  baseUrl?: string;
}

/** Factory used by the CLI/core to build a provider from resolved config. */
export function createProvider(config: ProviderConfig): Provider {
  switch (config.kind) {
    case "anthropic":
      return new AnthropicProvider({ apiKey: config.apiKey ?? "", baseUrl: config.baseUrl });
    case "openai":
      return new OpenAIProvider({ apiKey: config.apiKey ?? "", baseUrl: config.baseUrl });
    case "google":
      return new OpenAIProvider({
        apiKey: config.apiKey ?? "",
        baseUrl: config.baseUrl ?? GOOGLE_OPENAI_BASE,
      });
    case "mock":
      return new MockProvider();
    default: {
      const exhaustive: never = config.kind;
      throw new Error(`Unknown provider kind: ${String(exhaustive)}`);
    }
  }
}
