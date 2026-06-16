import { describe, expect, it } from "vitest";
import { formatStatus } from "../src/status.js";

describe("formatStatus", () => {
  it("formats a one-line run summary", () => {
    expect(formatStatus("mock", 2, { inputTokens: 10, outputTokens: 5 }, 2)).toBe(
      "mock · 2 turn(s) · 15 tokens · 2 impression(s)",
    );
  });
});
