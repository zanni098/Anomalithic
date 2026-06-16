import { AdTerminal } from "../components/AdTerminal";
import { ParticleField } from "../components/ParticleField";
import { Reveal } from "../components/Reveal";

const REPO = "https://github.com/zanni098/Anomalithic";

const MODELS = ["Claude", "GPT", "Llama", "Qwen", "DeepSeek", "Ollama", "OpenRouter"];

const CAPABILITIES = [
  {
    pkg: "@anomalithic/providers",
    title: "Any model, open or closed",
    body: "Anthropic, OpenAI, OpenRouter, Ollama, or any OpenAI-compatible endpoint — switched with a single flag.",
  },
  {
    pkg: "@anomalithic/mcp",
    title: "Model Context Protocol",
    body: "A first-class MCP client. Bring any MCP server's tools straight into the agent's tool registry.",
  },
  {
    pkg: "@anomalithic/skills",
    title: "Claude + Codex skills",
    body: "Loads Claude SKILL.md and Codex AGENTS.md into one unified, lazily-loaded skill system.",
  },
  {
    pkg: "@anomalithic/hooks",
    title: "Lifecycle hooks",
    body: "SessionStart, Pre/PostToolUse, Stop, Thinking. Gate, mutate, or extend every step of the loop.",
  },
  {
    pkg: "@anomalithic/orchestrator",
    title: "Teams of agents",
    body: "Durable task store, atomic checkout, dependency graph, per-agent budgets. Run for hours or days.",
  },
  {
    pkg: "@anomalithic/memory",
    title: "Cross-session memory",
    body: "A file-backed memory index plus recall, so the agent remembers facts across sessions and machines.",
  },
  {
    pkg: "@anomalithic/security",
    title: "Guardrails built in",
    body: "Secret redaction, a permission policy, path sandboxing, and an append-only audit trail.",
  },
  {
    pkg: "@anomalithic/core",
    title: "Signed thinking-impressions",
    body: "Every thinking window mints a runtime-signed impression — the un-spoofable trust anchor for ads.",
  },
];

const STACK = [
  { name: "kernel", desc: "the runtime that composes everything below", kernel: true },
  { name: "providers", desc: "any open or closed LLM" },
  { name: "tools + mcp", desc: "local tools and remote MCP servers" },
  { name: "skills", desc: "Claude SKILL.md + Codex AGENTS.md" },
  { name: "hooks", desc: "lifecycle gates and extensions" },
  { name: "memory", desc: "cross-session recall" },
  { name: "orchestrator", desc: "spawn and budget teams of agents" },
  { name: "security", desc: "redaction · permissions · sandbox · audit" },
];

const PLATFORMS = [
  { glyph: "CLI", name: "Command line", desc: "anomalithic run \"…\" — scriptable and pipe-friendly." },
  { glyph: "TUI", name: "Terminal UI", desc: "A full-screen interactive session for long-running work." },
  { glyph: "APP", name: "Desktop installers", desc: "Native Windows .msi, macOS .dmg, and Linux .deb / AppImage." },
  { glyph: "BOT", name: "Messaging gateway", desc: "Reach your agent on WhatsApp, Telegram, Slack, Discord, Signal." },
];

export default function Home() {
  return (
    <main id="top">
      <nav className="nav">
        <a href="#top" className="brand">
          <span className="brand-glyph" />
          ANOMALITHIC
        </a>
        <div className="nav-links">
          <a className="hide-sm" href="#capabilities">
            Capabilities
          </a>
          <a className="hide-sm" href="#os">
            Agentic OS
          </a>
          <a className="hide-sm" href="#earn">
            Earn
          </a>
          <a href={REPO} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a
            className="btn btn-primary"
            href={REPO}
            target="_blank"
            rel="noreferrer"
            style={{ padding: "8px 16px" }}
          >
            Get started
          </a>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="hero-canvas">
          <ParticleField />
        </div>
        <div className="hero-fade" />
        <div className="container hero-inner">
          <span className="eyebrow">Open-core agent runtime</span>
          <h1>
            One agent to <span className="accent italic">rule them all.</span>
          </h1>
          <p className="lead">
            Anomalithic is a model-agnostic AI agent runtime that speaks MCP, loads Claude and Codex
            skills, fires hooks, spawns teams of sub-agents, and remembers across sessions — and it
            funds itself with a thinking-time ad network that pays watchers 50/50.
          </p>
          <div className="hero-cta">
            <a className="btn btn-primary" href={REPO} target="_blank" rel="noreferrer">
              Star on GitHub →
            </a>
            <a className="btn btn-ghost" href="#earn">
              See how earning works
            </a>
          </div>
          <div className="model-row">
            <span className="label">Runs on</span>
            {MODELS.map((m) => (
              <span className="chip" key={m}>
                {m}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* CAPABILITIES */}
      <section className="section" id="capabilities">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow">Everything in one runtime</span>
              <h2>The whole agent, not a wrapper.</h2>
              <p className="lead">
                Nine focused, open-source packages compose into a single capable agent — each one
                tested, typed, and small enough to read in a sitting.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-3">
            {CAPABILITIES.map((c, i) => (
              <Reveal key={c.pkg} delay={(i % 3) * 80}>
                <div className="card">
                  <div className="kicker mono">{c.pkg}</div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        <div className="section-line" />
      </div>

      {/* AGENTIC OS */}
      <section className="section" id="os">
        <div className="container grid grid-2" style={{ alignItems: "center", gap: 56 }}>
          <Reveal>
            <div>
              <span className="eyebrow">An agentic OS</span>
              <h2 style={{ fontSize: "clamp(2rem,4.4vw,3.1rem)", margin: "16px 0 18px" }}>
                A kernel for autonomous work.
              </h2>
              <p className="lead">
                Anomalithic isn&apos;t a chat box — it&apos;s a small operating system for agents.
                The kernel wires providers, tools, skills, hooks, memory, and orchestration into one
                runtime you can run for minutes or for days.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="stack">
              {STACK.map((l) => (
                <div className={`layer${l.kernel ? " kernel" : ""}`} key={l.name}>
                  <span className="lname mono">{l.name}</span>
                  <span className="ldesc">{l.desc}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* EARN / ADS */}
      <section className="section" id="earn">
        <div className="container">
          <Reveal>
            <div className="earn">
              <span className="eyebrow accent-2" style={{ color: "var(--accent-2)" }}>
                The killer feature
              </span>
              <h2 style={{ fontSize: "clamp(2rem,4.4vw,3rem)", margin: "16px 0 14px" }}>
                Get paid while agents think.
              </h2>
              <p className="lead">
                Advertisers pay a monthly fee to place a small link that appears only while the agent
                is thinking. Watchers earn for those impressions — split 50/50, paid in stablecoin.
                Always toggleable.
              </p>
              <div className="grid grid-2" style={{ marginTop: 32, alignItems: "center" }}>
                <AdTerminal />
                <div>
                  <div className="split">
                    <div className="split-half split-you">
                      <div className="pct accent-2">50%</div>
                      <div className="mono" style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                        the platform
                      </div>
                    </div>
                    <div className="split-half split-them">
                      <div className="pct accent">50%</div>
                      <div className="mono" style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                        the watcher
                      </div>
                    </div>
                  </div>
                  <ul style={{ color: "var(--muted)", marginTop: 22, paddingLeft: 18, lineHeight: 2 }}>
                    <li>Impressions are runtime-signed — not spoofable client timers.</li>
                    <li>USDC on Base; redeem from an in-app wallet.</li>
                    <li>One quiet line. No banners, no tracking pixels.</li>
                    <li>Off by default on paid tiers; rewarded on the free tier.</li>
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PLATFORMS */}
      <section className="section" id="platforms">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow">Everywhere you work</span>
              <h2>Ships as a tool, runs as a service.</h2>
            </div>
          </Reveal>
          <div className="grid grid-2">
            {PLATFORMS.map((p, i) => (
              <Reveal key={p.name} delay={(i % 2) * 90}>
                <div className="card platform">
                  <span className="pglyph mono">{p.glyph}</span>
                  <div>
                    <h3 style={{ marginTop: 2 }}>{p.name}</h3>
                    <p>{p.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: 12 }}>
              <span className="brand-glyph" />
              ANOMALITHIC
            </div>
            <p style={{ maxWidth: "34ch", margin: 0 }}>
              One open-core agent runtime to rule them all. Built in the open.
            </p>
          </div>
          <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href={REPO} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href={`${REPO}#readme`} target="_blank" rel="noreferrer">
                Docs
              </a>
              <a href={`${REPO}/blob/main/LICENSING.md`} target="_blank" rel="noreferrer">
                License
              </a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href={`${REPO}/blob/main/ROADMAP.md`} target="_blank" rel="noreferrer">
                Roadmap
              </a>
              <a href={`${REPO}/blob/main/ARCHITECTURE.md`} target="_blank" rel="noreferrer">
                Architecture
              </a>
              <a
                href={`${REPO}/blob/main/docs/specs/thinking-impressions.md`}
                target="_blank"
                rel="noreferrer"
              >
                Ad spec
              </a>
            </div>
          </div>
        </div>
        <div className="container" style={{ marginTop: 40, color: "var(--faint)", fontSize: "0.82rem" }}>
          <span className="mono">Open-core · Apache-2.0 · {new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}
