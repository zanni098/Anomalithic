/** Small, hand-drawn SVG/HTML graphics — kept restrained and editorial. */

const MODELS = ["Claude", "GPT", "Llama", "Qwen", "DeepSeek", "Ollama", "OpenRouter"];

export function ModelRow() {
  return (
    <div className="chips">
      {MODELS.map((m) => (
        <span className="chip" key={m}>
          {m}
        </span>
      ))}
    </div>
  );
}

const LAYERS = [
  { name: "kernel", note: "composes everything below", kernel: true },
  { name: "providers", note: "any open or closed LLM" },
  { name: "tools · mcp", note: "local tools + MCP servers" },
  { name: "skills", note: "Claude SKILL.md + Codex AGENTS.md" },
  { name: "hooks", note: "lifecycle gates" },
  { name: "memory", note: "cross-session recall" },
  { name: "orchestrator", note: "teams of agents" },
  { name: "security", note: "redaction · permissions · sandbox" },
];

export function StackDiagram() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {LAYERS.map((l) => (
        <div
          key={l.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            padding: "13px 16px",
            borderRadius: 10,
            border: "1px solid var(--line)",
            background: l.kernel ? "color-mix(in srgb, var(--clay) 12%, var(--paper))" : "var(--paper)",
            borderColor: l.kernel ? "var(--clay)" : "var(--line)",
          }}
        >
          <span className="mono" style={{ fontSize: "0.86rem", color: "var(--ink)" }}>
            {l.name}
          </span>
          <span style={{ color: "var(--ink-soft)", fontSize: "0.86rem" }}>{l.note}</span>
        </div>
      ))}
    </div>
  );
}

export function SplitDonut() {
  // 50/50 donut: half clay (platform), half sage (watcher).
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 160 160" width="180" height="180" aria-label="50/50 split">
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--clay)" strokeWidth="20"
        strokeDasharray={`${c / 2} ${c / 2}`} transform="rotate(-90 80 80)" />
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--sage)" strokeWidth="20"
        strokeDasharray={`${c / 2} ${c / 2}`} strokeDashoffset={-c / 2} transform="rotate(-90 80 80)" />
      <text x="80" y="76" textAnchor="middle" className="serif" fontSize="26" fill="var(--ink)">50/50</text>
      <text x="80" y="98" textAnchor="middle" className="mono" fontSize="9" fill="var(--ink-soft)">
        SPLIT
      </text>
    </svg>
  );
}

const FLOW = [
  { k: "01", t: "Agent thinks", d: "a real provider round-trip opens a thinking window" },
  { k: "02", t: "Signed impression", d: "the runtime mints an HMAC-signed proof" },
  { k: "03", t: "Verify", d: "the ledger checks signature + nonce + dwell" },
  { k: "04", t: "Split 50/50", d: "watcher and platform each credited in USDC" },
];

export function ImpressionFlow() {
  return (
    <div className="grid cols-2" style={{ gap: 14 }}>
      {FLOW.map((s) => (
        <div key={s.k} className="card" style={{ padding: 22 }}>
          <span className="mono clay" style={{ fontSize: "0.82rem" }}>{s.k}</span>
          <h3 style={{ fontSize: "1.12rem", margin: "8px 0 6px" }}>{s.t}</h3>
          <p style={{ fontSize: "0.92rem" }}>{s.d}</p>
        </div>
      ))}
    </div>
  );
}
