import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { apiKeyEnvVar, loadConfig } from "../src/config.js";

const KEYS = [
  "ANOMALITHIC_PROVIDER",
  "ANOMALITHIC_MODEL",
  "ANOMALITHIC_ADS",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
];

describe("loadConfig", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("defaults to anthropic with its default model and ads off", () => {
    const cfg = loadConfig();
    expect(cfg.kind).toBe("anthropic");
    expect(cfg.model).toBe("claude-sonnet-4-6");
    expect(cfg.ads).toBe(false);
  });

  it("CLI overrides win over environment", () => {
    process.env.ANOMALITHIC_PROVIDER = "anthropic";
    process.env.ANOMALITHIC_MODEL = "from-env";
    const cfg = loadConfig({ provider: "openai", model: "from-flag" });
    expect(cfg.kind).toBe("openai");
    expect(cfg.model).toBe("from-flag");
  });

  it("reads the openai base url and key from env", () => {
    process.env.ANOMALITHIC_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_BASE_URL = "http://localhost:11434/v1";
    const cfg = loadConfig();
    expect(cfg.apiKey).toBe("sk-test");
    expect(cfg.baseUrl).toBe("http://localhost:11434/v1");
  });

  it("enables ads when ANOMALITHIC_ADS=on", () => {
    process.env.ANOMALITHIC_ADS = "on";
    expect(loadConfig().ads).toBe(true);
  });

  it("maps provider kinds to their api key env var", () => {
    expect(apiKeyEnvVar("anthropic")).toBe("ANTHROPIC_API_KEY");
    expect(apiKeyEnvVar("openai")).toBe("OPENAI_API_KEY");
    expect(apiKeyEnvVar("mock")).toBeUndefined();
  });
});
