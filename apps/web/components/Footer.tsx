import Link from "next/link";
import { Logo } from "./Logo";

const REPO = "https://github.com/zanni098/Anomalithic";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div style={{ maxWidth: "32ch" }}>
          <div className="brand" style={{ marginBottom: 12 }}>
            <Logo />
            Anomalithic
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: "0.92rem" }}>
            One open-core, model-agnostic agent runtime to rule them all. Built in the open.
          </p>
        </div>
        <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <strong style={{ fontSize: "0.8rem", marginBottom: 8 }}>Product</strong>
            <Link href="/product">Capabilities</Link>
            <Link href="/builder">Agent builder</Link>
            <Link href="/earn">Earn</Link>
            <Link href="/docs">Docs</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <strong style={{ fontSize: "0.8rem", marginBottom: 8 }}>Open source</strong>
            <a href={REPO} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={`${REPO}/blob/main/ROADMAP.md`} target="_blank" rel="noreferrer">
              Roadmap
            </a>
            <a href={`${REPO}/blob/main/LICENSING.md`} target="_blank" rel="noreferrer">
              License
            </a>
          </div>
        </div>
      </div>
      <div className="container" style={{ marginTop: 36, color: "var(--ink-faint)", fontSize: "0.8rem" }}>
        <span className="mono">Open-core · Apache-2.0 · anomaly + lithic (abnormal stone)</span>
      </div>
    </footer>
  );
}
