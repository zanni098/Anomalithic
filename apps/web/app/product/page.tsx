import type { Metadata } from "next";
import { Reveal } from "../../components/Reveal";
import { ModelRow, StackDiagram } from "../../components/graphics";

export const metadata: Metadata = { title: "Product — Anomalithic" };

const CAPS = [
  { pkg: "@anomalithic/providers", title: "Any model", body: "Anthropic, OpenAI, OpenRouter, Ollama, or any OpenAI-compatible endpoint." },
  { pkg: "@anomalithic/core", title: "Signed thinking-impressions", body: "Every thinking window mints a runtime-signed proof — the trust anchor for ads." },
  { pkg: "@anomalithic/mcp", title: "Model Context Protocol", body: "A first-class MCP client; bring any server's tools into the agent." },
  { pkg: "@anomalithic/skills", title: "Claude + Codex skills", body: "Loads Claude SKILL.md and Codex AGENTS.md into one skill system." },
  { pkg: "@anomalithic/hooks", title: "Lifecycle hooks", body: "Gate, mutate, or extend every step: SessionStart, Pre/PostToolUse, Stop, Thinking." },
  { pkg: "@anomalithic/orchestrator", title: "Teams of agents", body: "Durable task store, atomic checkout, budgets — run for hours or days." },
  { pkg: "@anomalithic/memory", title: "Cross-session memory", body: "A file-backed memory index plus recall, persistent across sessions." },
  { pkg: "@anomalithic/security", title: "Guardrails", body: "Secret redaction, permission policy, path sandbox, audit trail." },
];

export default function Product() {
  return (
    <main>
      <section className="section" style={{ paddingBottom: 36 }}>
        <div className="container">
          <span className="eyebrow">The runtime</span>
          <h1 className="h-sub" style={{ marginTop: 14 }}>Ten packages. One capable agent.</h1>
          <p className="lead" style={{ marginTop: 18 }}>
            Each piece is small, typed, and tested — and composes into the agentic-OS kernel. Nothing
            is a black box.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container grid cols-3">
          {CAPS.map((c, i) => (
            <Reveal key={c.pkg} delay={(i % 3) * 70}>
              <div className="card">
                <div className="kicker mono">{c.pkg}</div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="container">
        <div className="rule" />
      </div>

      <section className="section">
        <div className="container grid cols-2" style={{ gap: 48, alignItems: "center" }}>
          <Reveal>
            <div>
              <span className="eyebrow">An agentic OS</span>
              <h2 style={{ fontSize: "clamp(1.9rem,4vw,2.7rem)", margin: "14px 0 16px" }}>
                A kernel for autonomous work.
              </h2>
              <p className="lead">
                The kernel wires providers, tools, skills, hooks, memory, and orchestration into one
                runtime you can run for minutes or for days — locally, on your keys.
              </p>
              <div className="chips" style={{ marginTop: 22 }}>
                <span className="chip-label">Runs on</span>
                <ModelRow />
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <StackDiagram />
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Runs anywhere</span>
            <h2>Ships as a tool, runs as a service.</h2>
          </div>
          <div className="terminal" style={{ maxWidth: 720 }}>
            <div className="terminal-bar">
              <span className="d" />
              <span className="d" />
              <span className="d" />
              <span className="t">anomalithic — session</span>
            </div>
            <div className="terminal-body">
              <div>
                <span className="p">$</span> anomalithic run &quot;explain MCP in one line&quot; --ads
              </div>
              <div className="think">✦ thinking…</div>
              <div className="ad">💡 Your ad here while agents think — anomalithic.vercel.app/ads</div>
              <div>MCP is an open protocol that lets agents call external tools and</div>
              <div>data sources over a uniform JSON-RPC interface.</div>
              <div className="think">[anthropic:claude-sonnet-4-6] 1 turn · 1 signed impression</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
