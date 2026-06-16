"use client";

import { useEffect, useState } from "react";

const DURATIONS = [1500, 2000, 3400];

/**
 * Animated demo of the killer feature: while the agent "thinks", a single
 * unobtrusive ad line appears, then disappears once the answer streams.
 */
export function AdTerminal() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const settle = setTimeout(() => setPhase(2), 0);
      return () => clearTimeout(settle);
    }
    const timer = setTimeout(() => setPhase((p) => (p + 1) % 3), DURATIONS[phase] ?? 2000);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div className="terminal" aria-hidden="true">
      <div className="terminal-bar">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="terminal-title">anomalithic — session</span>
      </div>
      <div className="terminal-body">
        <div>
          <span className="prompt">$</span> anomalithic run &quot;explain MCP in one line&quot;
        </div>
        {phase >= 1 && <div className="think">✦ thinking…</div>}
        {phase === 1 && (
          <div className="ad">💡 Your ad here while agents think — anomalithic.dev/ads</div>
        )}
        {phase >= 2 && (
          <div className="out">
            MCP is an open protocol that lets agents call external tools and data
            <br />
            sources over a uniform JSON-RPC interface.
          </div>
        )}
        {phase >= 2 && (
          <div className="think" style={{ marginTop: 8 }}>
            [anthropic:claude-sonnet-4-6] 1 turn · 1 signed impression
          </div>
        )}
      </div>
    </div>
  );
}
