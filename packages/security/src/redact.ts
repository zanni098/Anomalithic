interface Pattern {
  type: string;
  source: string;
  flags: string;
}

const PATTERNS: Pattern[] = [
  { type: "openai_key", source: "sk-[A-Za-z0-9_-]{20,}", flags: "g" },
  { type: "aws_access_key", source: "AKIA[0-9A-Z]{16}", flags: "g" },
  { type: "github_token", source: "gh[posu]_[A-Za-z0-9]{20,}", flags: "g" },
  { type: "bearer_token", source: "Bearer\\s+[A-Za-z0-9._-]{10,}", flags: "g" },
  {
    type: "private_key",
    source: "-----BEGIN [A-Z ]*PRIVATE KEY-----[\\s\\S]*?-----END [A-Z ]*PRIVATE KEY-----",
    flags: "g",
  },
  {
    type: "assignment",
    source:
      "\\b[A-Z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD|PASSWD)\\b\\s*[:=]\\s*[\"']?[^\\s\"']+[\"']?",
    flags: "g",
  },
];

const REDACTED = "***REDACTED***";

export interface SecretMatch {
  type: string;
  match: string;
}

/** Finds likely secrets in text without modifying it. */
export function listSecrets(text: string): SecretMatch[] {
  const found: SecretMatch[] = [];
  for (const { type, source, flags } of PATTERNS) {
    const matches = text.match(new RegExp(source, flags));
    if (!matches) continue;
    for (const match of matches) found.push({ type, match });
  }
  return found;
}

/** Replaces likely secrets with a redaction marker (keeps assignment keys visible). */
export function redactSecrets(text: string): string {
  let out = text;
  for (const { type, source, flags } of PATTERNS) {
    const re = new RegExp(source, flags);
    if (type === "assignment") {
      out = out.replace(re, (full) => {
        const sepIndex = Math.max(full.indexOf("="), full.indexOf(":"));
        const key = sepIndex >= 0 ? full.slice(0, sepIndex + 1) : full;
        return `${key} ${REDACTED}`;
      });
    } else {
      out = out.replace(re, REDACTED);
    }
  }
  return out;
}
