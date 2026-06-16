import type { Metadata } from "next";
import { AgentBuilder } from "../../components/builder/AgentBuilder";

export const metadata: Metadata = {
  title: "Agent builder — Anomalithic",
  description: "Build an Anomalithic agent visually: drag nodes, wire prompts, tools, and code.",
};

export default function BuilderPage() {
  return (
    <main>
      <section className="section" style={{ paddingBottom: 28 }}>
        <div className="container">
          <span className="eyebrow">Visual agent builder</span>
          <h1 className="h-sub" style={{ marginTop: 14, maxWidth: "20ch" }}>
            Build an agent by dragging nodes.
          </h1>
          <p className="lead" style={{ marginTop: 18 }}>
            Compose providers, prompts, tools, code, and sub-agents on a canvas, wire them together,
            and export an Anomalithic agent definition. No code required — but code is a first-class
            node.
          </p>
        </div>
      </section>
      <div className="container" style={{ paddingBottom: 96 }}>
        <AgentBuilder />
      </div>
    </main>
  );
}
