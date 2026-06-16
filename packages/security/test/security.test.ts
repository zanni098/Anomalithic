import { describe, expect, it } from "vitest";
import { AuditLog } from "../src/audit.js";
import { PermissionPolicy } from "../src/permissions.js";
import { redactSecrets } from "../src/redact.js";
import { assertPathInside, isPathInside } from "../src/sandbox.js";

describe("security", () => {
  it("redacts secrets", () => {
    const out = redactSecrets("key sk-abcdefghijklmnopqrstuvwx and API_KEY=topsecret");
    expect(out).not.toContain("sk-abcdefghijklmnopqrstuvwx");
    expect(out).not.toContain("topsecret");
    expect(out).toContain("***REDACTED***");
  });

  it("applies permission precedence and globs", () => {
    const policy = new PermissionPolicy({
      allow: ["read *"],
      deny: ["read /etc/*"],
      default: "ask",
    });
    expect(policy.evaluate("read /etc/passwd")).toBe("deny");
    expect(policy.evaluate("read notes.txt")).toBe("allow");
    expect(policy.evaluate("write notes.txt")).toBe("ask");
  });

  it("guards path traversal", () => {
    expect(isPathInside("/work", "/work/sub/file")).toBe(true);
    expect(() => assertPathInside("/work", "../etc/passwd")).toThrow();
  });

  it("records audit entries with timestamps", () => {
    const log = new AuditLog();
    const entry = log.append({ actor: "agent", action: "tool.run", detail: "ls" });
    expect(entry.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(log.entries()).toHaveLength(1);
  });
});
