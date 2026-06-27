import Link from "next/link";
import { ModelRow } from "../components/graphics";
import { Reveal } from "../components/Reveal";

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
        <div className="container hero-inner">
          <span className="badge">
            <span className="dot" /> Open-core agent runtime · loop engineering built in
          </span>
          <h1 className="display" style={{ marginTop: 22 }}>
            One agent to <span className="clay italic">rule them all.</span>
          </h1>
          <p className="lead" style={{ marginTop: 24 }}>
            Anomalithic is a model-agnostic AI agent runtime — MCP, Claude &amp; Codex skills, hooks,
            teams of sub-agents, cross-session memory, and a visual builder. Stop prompting; write
            loops that run themselves to a verified bar. Open-core, self-hostable, funded by a
            thinking-time ad network that pays watchers 50/50.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 34, flexWrap: "wrap" }}>
            <a className="btn btn-primary" href={REPO} target="_blank" rel="noreferrer">
              Star on GitHub
            </a>
            <Link className="btn btn-ghost" href="/builder">
              Try the agent builder →
            </Link>
          </div>
          <div className="chips" style={{ marginTop: 44 }}>
            <span className="chip-label">Runs on</span>
            <ModelRow />
          </div>

          <div className="terminal" style={{ marginTop: 56 }}>
            <div className="terminal-bar">
              <span className="d r" />
              <span className="d y" />
              <span className="d g" />
              <span className="t">anomalithic — zsh</span>
            </div>
            <div className="terminal-body">
              <span className="think"># one line, then walk away — the loop runs itself</span>
              {"\n"}
              <span className="p">$</span> anomalithic run --goal "fix every failing test until{" "}
              <span className="mark">`pnpm test`</span> is green"
              {"\n"}
              <span className="think">✦ planning → editing → running tests → verifying…</span>
              {"\n"}
              <span className="ok">✓ 23 passed · 0 failed</span> — goal verified, exiting clean
              {"\n\n"}
              <span className="p">$</span> anomalithic skills
              {"\n"}
              <span className="mark">▣ loop-engineering</span>{" "}
              <span className="think">stop prompting — write loops that verify themselves</span>
              {"\n"}
              <span className="think">1 skill · ▣ claude · ▢ codex</span>
            </div>
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

      <div className="container">
        <div className="rule" />
      </div>

      <section className="section">
        <div className="container">
          <div className="grid cols-2" style={{ alignItems: "center", gap: 48 }}>
            <Reveal>
              <div>
                <span className="eyebrow">Built-in skill</span>
                <h2 style={{ fontSize: "clamp(2rem, 4.4vw, 3rem)", margin: "14px 0 16px" }}>
                  Stop prompting. <span className="clay italic">Start writing loops.</span>
                </h2>
                <p className="lead" style={{ marginBottom: 22 }}>
                  Anomalithic ships the <span className="mono">loop-engineering</span> skill out of
                  the box. A prompt is you, babysitting every turn. A loop takes you out of the
                  chair: write the goal, the check, and the stop once — the agent runs the
                  ask–answer–correct cycle until the work clears the bar.
                </p>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <a
                    className="btn btn-primary"
                    href={`${REPO}/tree/main/skills/loop-engineering`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read the skill
                  </a>
                  <a
                    className="btn btn-ghost"
                    href="https://github.com/zanni098/loop-engineering-skill"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Standalone repo →
                  </a>
                </div>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="terminal">
                <div className="terminal-bar">
                  <span className="d r" />
                  <span className="d y" />
                  <span className="d g" />
                  <span className="t">the 5-step loop</span>
                </div>
                <div className="terminal-body">
                  <span className="mark">GOAL</span>   define "done" — observable, binary, bounded
                  {"\n"}
                  <span className="mark">PLAN</span>   state the single next step
                  {"\n"}
                  <span className="mark">DO</span>     produce or improve the work
                  {"\n"}
                  <span className="mark">VERIFY</span> a hostile critic + a real check, not an opinion
                  {"\n"}
                  <span className="mark">DECIDE</span> all pass → <span className="ok">FINAL</span>,
                  else <span className="think">ITERATING</span>
                  {"\n\n"}
                  <span className="think"># verify is the whole game — separate maker from checker</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
