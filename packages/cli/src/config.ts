import type { ProviderKind } from "@anomalithic/providers";

export interface CliOverrides {
  provider?: string;
  model?: string;
  ads?: boolean;
  session?: string;
  resume?: boolean;
}

export interface ResolvedConfig {
  kind: ProviderKind;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  ads: boolean;
}

const DEFAULT_MODELS: Record<ProviderKind, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4o-mini",
  google: "gemini-2.5-flash",
  mock: "mock",
};

function asKind(value: string | undefined): ProviderKind {
  if (value === "anthropic" || value === "openai" || value === "google" || value === "mock") {
    return value;
  }
  return "anthropic";
}

/** Resolves runtime config from CLI flags then environment, with sane defaults. */
export function loadConfig(overrides: CliOverrides = {}): ResolvedConfig {
  const kind = asKind(overrides.provider ?? process.env.ANOMALITHIC_PROVIDER);
  const model = overrides.model ?? process.env.ANOMALITHIC_MODEL ?? DEFAULT_MODELS[kind];
  const ads = overrides.ads ?? (process.env.ANOMALITHIC_ADS ?? "off").toLowerCase() === "on";

  const base: ResolvedConfig = { kind, model, ads };
  switch (kind) {
    case "anthropic":
      return { ...base, apiKey: process.env.ANTHROPIC_API_KEY };
    case "openai":
      return {
        ...base,
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL,
      };
    case "google":
      return { ...base, apiKey: process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY };
    case "mock":
      return base;
  }
}

export function apiKeyEnvVar(kind: ProviderKind): string | undefined {
  if (kind === "anthropic") return "ANTHROPIC_API_KEY";
  if (kind === "openai") return "OPENAI_API_KEY";
  if (kind === "google") return "GOOGLE_API_KEY";
  return undefined;
}
