import Link from "next/link";
import { ParticleField } from "../components/ParticleField";
import { Reveal } from "../components/Reveal";
import { ModelRow } from "../components/graphics";

const REPO = "https://github.com/zanni098/Anomalithic";

const HIGHLIGHTS = [
  {
    kicker: "model-agnostic",
    title: "Any model, open or closed",
    body: "Anthropic, OpenAI, OpenRouter, Ollama, or any OpenAI-compatible endpoint — switched with one flag.",
  },
  {
    kicker: "an agentic OS",
    title: "A kernel, not a wrapper",
    body: "Ten packages — providers, MCP, skills, hooks, memory, orchestration, security — compose into one runtime.",
  },
  {
    kicker: "the killer feature",
    title: "Get paid while it thinks",
    body: "A quiet ad shows only while the agent reasons. Watchers earn — split 50/50, paid in stablecoin.",
  },
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-canvas">
          <ParticleField />
        </div>
        <div className="container hero-inner">
          <span className="eyebrow">Open-core agent runtime</span>
          <h1 className="display" style={{ marginTop: 18 }}>
            One agent to <span className="clay italic">rule them all.</span>
          </h1>
          <p className="lead" style={{ marginTop: 24 }}>
            Anomalithic is a model-agnostic AI agent runtime — MCP, Claude &amp; Codex skills, hooks,
            teams of sub-agents, cross-session memory, and a visual builder. Open-core, self-hostable,
            and funded by a thinking-time ad network that pays watchers 50/50.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 34, flexWrap: "wrap" }}>
            <a className="btn btn-primary" href={REPO} target="_blank" rel="noreferrer">
              Star on GitHub
            </a>
            <Link className="btn btn-ghost" href="/builder">
              Try the agent builder →
            </Link>
          </div>
          <div className="chips" style={{ marginTop: 46 }}>
            <span className="chip-label">Runs on</span>
            <ModelRow />
          </div>
        </div>
      </section>

      <div className="container">
        <div className="rule" />
      </div>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="eyebrow">Why Anomalithic</span>
              <h2>The whole agent — and the economy around it.</h2>
            </div>
          </Reveal>
          <div className="grid cols-3">
            {HIGHLIGHTS.map((h, i) => (
              <Reveal key={h.title} delay={(i % 3) * 80}>
                <div className="card">
                  <div className="kicker">{h.kicker}</div>
                  <h3>{h.title}</h3>
                  <p>{h.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div
              style={{
                marginTop: 40,
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Link className="btn btn-ghost" href="/product">
                Explore the runtime
              </Link>
              <Link className="btn btn-ghost" href="/earn">
                How earning works
              </Link>
              <Link className="btn btn-ghost" href="/docs">
                Read the docs
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
