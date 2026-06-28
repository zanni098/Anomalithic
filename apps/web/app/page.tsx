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
    kicker: "a real harness",
    title: "Plan · act · verify · stop",
    body: "It plans, runs real checks, has a hostile checker grade the work, and stops at a verified bar — watch it live.",
  },
  {
    kicker: "the killer feature",
    title: "Get paid while it thinks",
    body: "A quiet ad shows only while the agent reasons. Watchers earn — split 50/50, paid in stablecoin.",
  },
];

function AppShot() {
  return (
    <div className="appshot">
      <style>{`
/* ---------- app preview mock (orchestrator console) ---------- */
.appshot {
  border: 1px solid rgba(31, 30, 29, 0.18);
  border-radius: 16px;
  overflow: hidden;
  background: #1a1916;
  box-shadow: 0 40px 90px -45px rgba(31, 30, 29, 0.7);
  color: #ece9e1;
  font-size: 12px;
}
.appshot .bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  background: #201e1b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}
.appshot .bar .d {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #4a4740;
}
.appshot .bar .d.r {
  background: #e06c52;
}
.appshot .bar .d.y {
  background: #e0a64a;
}
.appshot .bar .d.g {
  background: #6fae6a;
}
.appshot .bar .ttl {
  margin-left: 8px;
  font-family: var(--font-mono), monospace;
  font-size: 11px;
  color: #8a8578;
}
.appshot .bar .mdl {
  margin-left: auto;
  font-family: var(--font-mono), monospace;
  font-size: 10.5px;
  color: #b4afa3;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 3px 9px;
}
.appshot .grid {
  display: grid;
  grid-template-columns: 150px 1fr 168px;
  min-height: 340px;
}
.appshot .rail {
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  padding: 12px 9px;
  background: #1d1b18;
}
.appshot .ni {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 9px;
  border-radius: 7px;
  color: #b4afa3;
  font-size: 11.5px;
}
.appshot .ni.on {
  background: rgba(255, 255, 255, 0.05);
  color: #ece9e1;
  box-shadow: inset 2px 0 0 var(--clay);
}
.appshot .main {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.appshot .mrow {
  display: flex;
  gap: 9px;
}
.appshot .av {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  flex: none;
  background: rgba(217, 119, 87, 0.16);
  border: 1px solid rgba(217, 119, 87, 0.35);
}
.appshot .av.u {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}
.appshot .mb {
  line-height: 1.5;
  color: #d8d3c8;
}
.appshot .pc {
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 9px;
  overflow: hidden;
}
.appshot .pc .ph {
  background: rgba(255, 255, 255, 0.04);
  padding: 6px 11px;
  font-size: 10.5px;
  color: #8a8578;
  font-family: var(--font-mono), monospace;
}
.appshot .st {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 11px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 11px;
}
.appshot .st:first-of-type {
  border-top: none;
}
.appshot .ck {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  flex: none;
}
.appshot .st.ok .ck {
  background: #6fae6a;
  border-color: #6fae6a;
}
.appshot .st.ok span {
  color: #8a8578;
  text-decoration: line-through;
}
.appshot .st.now .ck {
  border-color: var(--clay);
}
.appshot .term2 {
  background: #131210;
  border-radius: 8px;
  font-family: var(--font-mono), monospace;
  font-size: 10.5px;
  line-height: 1.7;
  padding: 9px 11px;
  color: #e7e3d8;
}
.appshot .term2 .ok {
  color: #6fae6a;
}
.appshot .term2 .c {
  color: var(--clay-soft);
}
.appshot .act {
  border-left: 1px solid rgba(255, 255, 255, 0.07);
  padding: 12px 11px;
  background: #1d1b18;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.appshot .act h6 {
  margin: 0 0 7px;
  font-size: 9.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #635f56;
}
.appshot .agc {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 7px;
  margin-bottom: 6px;
  font-size: 10.5px;
}
.appshot .agc .ab {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 9px;
}
.appshot .ab.m {
  background: rgba(217, 119, 87, 0.18);
  color: var(--clay);
}
.appshot .ab.c {
  background: rgba(122, 162, 214, 0.2);
  color: #7aa2d6;
}
.appshot .agc .ss {
  margin-left: auto;
  font-family: var(--font-mono), monospace;
  font-size: 9px;
  color: #e0a64a;
}
.appshot .mt {
  margin-bottom: 8px;
}
.appshot .mt .mh {
  display: flex;
  font-size: 10px;
  color: #b4afa3;
  margin-bottom: 4px;
}
.appshot .mt .mh b {
  margin-left: auto;
  font-family: var(--font-mono), monospace;
  color: #ece9e1;
}
.appshot .mt .bb {
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
  overflow: hidden;
}
.appshot .mt .bb i {
  display: block;
  height: 100%;
  background: var(--clay);
}
@media (max-width: 760px) {
  .appshot .grid {
    grid-template-columns: 1fr;
  }
  .appshot .rail,
  .appshot .act {
    display: none;
  }
}
`}</style>
      <div className="bar">
        <span className="d r" />
        <span className="d y" />
        <span className="d g" />
        <span className="ttl">Anomalithic — Agent Orchestrator</span>
        <span className="mdl">claude-sonnet-4-6 ● live</span>
      </div>
      <div className="grid">
        <div className="rail">
          <div className="ni on">💬 Console</div>
          <div className="ni">▤ Plan</div>
          <div className="ni">▶ Terminal</div>
          <div className="ni">▣ Skills</div>
          <div className="ni">◔ Memory</div>
          <div className="ni">⇄ Connectors</div>
          <div className="ni">◆ Earn</div>
        </div>
        <div className="main">
          <div className="mrow">
            <span className="av u" />
            <div className="mb">Fix every failing test until <span className="mono">pnpm test</span> is green.</div>
          </div>
          <div className="mrow">
            <span className="av" />
            <div className="mb" style={{ flex: 1 }}>
              On it — working as a loop with a checkable bar.
              <div className="pc" style={{ marginTop: 8 }}>
                <div className="ph">▤ plan · persistent spine</div>
                <div className="st ok"><span className="ck" /><span>Run the suite, see what fails</span></div>
                <div className="st ok"><span className="ck" /><span>Fix the weakest failure first</span></div>
                <div className="st now"><span className="ck" /><span>Verify: hostile checker re-runs all tests</span></div>
              </div>
              <div className="term2" style={{ marginTop: 8 }}>
                <div><span className="c">$ pnpm test</span></div>
                <div><span className="ok">✓ 24 passed (24 total)</span></div>
                <div style={{ color: "#8a8578" }}>goal verified — FINAL ✓</div>
              </div>
            </div>
          </div>
        </div>
        <div className="act">
          <div>
            <h6>Sub-agents</h6>
            <div className="agc"><span className="ab m">M</span> Maker<span className="ss">working</span></div>
            <div className="agc"><span className="ab c">C</span> Checker<span className="ss">verifying</span></div>
          </div>
          <div>
            <h6>Budget</h6>
            <div className="mt"><div className="mh">Turns <b>8 / 20</b></div><div className="bb"><i style={{ width: "40%" }} /></div></div>
            <div className="mt"><div className="mh">Spend <b>$0.61</b></div><div className="bb"><i style={{ width: "41%" }} /></div></div>
          </div>
          <div>
            <h6>Earned</h6>
            <div className="mono" style={{ color: "var(--clay)", fontSize: 16 }}>$0.36</div>
            <div style={{ fontSize: 10, color: "#635f56" }}>18 signed impressions</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-inner">
          <span className="badge">
            <span className="dot" /> Open-core agent runtime · the orchestrator + harness
          </span>
          <h1 className="display" style={{ marginTop: 22 }}>
            One agent to <span className="clay italic">rule them all.</span>
          </h1>
          <p className="lead" style={{ marginTop: 24 }}>
            Anomalithic is a model-agnostic AI agent runtime with a real orchestration console — MCP,
            Claude &amp; Codex skills, hooks, teams of sub-agents, cross-session memory, and a visual
            builder. Give it a goal; watch it plan, act, verify, and stop at a checkable bar.
            Open-core, self-hostable, funded by a thinking-time ad network that pays watchers 50/50.
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 34, flexWrap: "wrap" }}>
            <a className="btn btn-primary" href={REPO} target="_blank" rel="noreferrer">
              Star on GitHub
            </a>
            <a
              className="btn btn-ghost"
              href={`${REPO}/releases/latest`}
              target="_blank"
              rel="noreferrer"
            >
              Download the desktop app →
            </a>
          </div>
          <div className="chips" style={{ marginTop: 44 }}>
            <span className="chip-label">Runs on</span>
            <ModelRow />
          </div>

          <Reveal>
            <div style={{ marginTop: 56 }}>
              <AppShot />
            </div>
          </Reveal>
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
              <h2>A working harness — and the economy around it.</h2>
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
