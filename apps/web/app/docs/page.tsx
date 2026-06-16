import type { Metadata } from "next";

export const metadata: Metadata = { title: "Docs — Anomalithic" };

const REPO = "https://github.com/zanni098/Anomalithic";

const LINKS = [
  { label: "Architecture", href: `${REPO}/blob/main/ARCHITECTURE.md` },
  { label: "Roadmap", href: `${REPO}/blob/main/ROADMAP.md` },
  { label: "Ad-impression spec", href: `${REPO}/blob/main/docs/specs/thinking-impressions.md` },
  { label: "Memory format", href: `${REPO}/blob/main/docs/specs/memory-format.md` },
  { label: "Desktop builds", href: `${REPO}/blob/main/docs/desktop.md` },
  { label: "Licensing (open-core)", href: `${REPO}/blob/main/LICENSING.md` },
];

export default function Docs() {
  return (
    <main>
      <section className="section" style={{ paddingBottom: 40 }}>
        <div className="container">
          <span className="eyebrow">Docs</span>
          <h1 className="h-sub" style={{ marginTop: 14 }}>Start in two commands.</h1>
          <p className="lead" style={{ marginTop: 18 }}>
            Anomalithic is a TypeScript monorepo (Bun / pnpm / Turborepo). The runtime packages are
            Apache-2.0; clone, build, and run on your own keys.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <h3 className="serif" style={{ fontSize: "1.4rem", marginBottom: 14 }}>Quickstart</h3>
          <div className="terminal">
            <div className="terminal-bar">
              <span className="d" />
              <span className="d" />
              <span className="d" />
              <span className="t">bash</span>
            </div>
            <div className="terminal-body">
              <div><span className="p">$</span> pnpm install &amp;&amp; pnpm build</div>
              <div className="think"># offline demo — no API key needed</div>
              <div><span className="p">$</span> node packages/cli/dist/index.js run -p mock &quot;hello&quot;</div>
              <div className="think"># real model — set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env</div>
              <div><span className="p">$</span> anomalithic run &quot;explain MCP in one sentence&quot;</div>
              <div className="think"># any OpenAI-compatible endpoint (Ollama, OpenRouter, local)</div>
              <div><span className="p">$</span> ANOMALITHIC_PROVIDER=openai OPENAI_BASE_URL=http://localhost:11434/v1 \</div>
              <div>&nbsp;&nbsp;anomalithic run -m llama3.1 &quot;hi&quot;</div>
            </div>
          </div>

          <h3 className="serif" style={{ fontSize: "1.4rem", margin: "40px 0 14px" }}>More CLI</h3>
          <div className="terminal">
            <div className="terminal-bar">
              <span className="d" />
              <span className="d" />
              <span className="d" />
              <span className="t">bash</span>
            </div>
            <div className="terminal-body">
              <div><span className="p">$</span> anomalithic skills ~/.claude/skills</div>
              <div><span className="p">$</span> anomalithic memory recall &quot;which provider models&quot;</div>
              <div><span className="p">$</span> anomalithic mcp npx -y @modelcontextprotocol/server-everything</div>
            </div>
          </div>

          <h3 className="serif" style={{ fontSize: "1.4rem", margin: "40px 0 14px" }}>Reference</h3>
          <div className="grid cols-2">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="card" style={{ padding: 18 }}>
                <span className="mono" style={{ fontSize: "0.9rem" }}>{l.label} →</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
