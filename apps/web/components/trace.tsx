"use client"

import type { RuntimeEvent } from "@anomalithic/sdk"
import { AnimatePresence, motion } from "framer-motion"
import { ThinkingState } from "./graphics"

const AGENT_HUE: Record<string, string> = {
  Orchestrator: "#c2603a",
  Researcher: "#3a7ec2",
  Coder: "#4caf7d",
  Analyst: "#9b6dc2",
  Writer: "#c2a23a",
  Slides: "#c23a6d",
  Docs: "#3ac2b0",
  Image: "#c27d3a",
  Video: "#6d3ac2",
}
const hue = (name: string) => AGENT_HUE[name] ?? "var(--accent)"

const row = {
  initial: { opacity: 0, y: 10, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: "0.72rem",
        padding: "0.15rem 0.5rem",
        borderRadius: 99,
        background: `color-mix(in oklab, ${color} 14%, transparent)`,
        color,
        border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  )
}

/** Renders the runtime event stream as an animated, agent-attributed trace. */
export function TraceView({ events, running }: { events: RuntimeEvent[]; running: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
      <AnimatePresence initial={false}>
        {events.map((e, i) => {
          const key = `${i}-${e.type}`
          if (e.type === "agent.start") {
            return (
              <motion.div
                key={key}
                {...row}
                layout
                style={{ marginTop: i ? "0.6rem" : 0, display: "flex", alignItems: "center", gap: "0.6rem" }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: hue(e.agent),
                    boxShadow: `0 0 12px ${hue(e.agent)}`,
                  }}
                />
                <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>{e.agent}</strong>
                <Chip color={hue(e.agent)}>{e.role}</Chip>
              </motion.div>
            )
          }
          if (e.type === "thinking.start") {
            return (
              <motion.div key={key} {...row} style={{ paddingLeft: "1.4rem" }}>
                <ThinkingState />
              </motion.div>
            )
          }
          if (e.type === "delegate") {
            return (
              <motion.div
                key={key}
                {...row}
                style={{ paddingLeft: "1.4rem", display: "flex", gap: "0.5rem", alignItems: "center" }}
              >
                <Chip color={hue(e.from)}>{e.from}</Chip>
                <span style={{ color: "var(--text-soft)" }}>→ delegates →</span>
                <Chip color={hue(e.to)}>{e.to}</Chip>
                <span style={{ color: "var(--text-soft)", fontSize: "0.85rem" }}>{e.task.slice(0, 80)}</span>
              </motion.div>
            )
          }
          if (e.type === "handoff") {
            return (
              <motion.div
                key={key}
                {...row}
                style={{ paddingLeft: "1.4rem", display: "flex", gap: "0.5rem", alignItems: "center" }}
              >
                <Chip color={hue(e.from)}>{e.from}</Chip>
                <span style={{ color: "var(--text-soft)" }}>⇄ hands off →</span>
                <Chip color={hue(e.to)}>{e.to}</Chip>
              </motion.div>
            )
          }
          if (e.type === "tool.call") {
            return (
              <motion.div key={key} {...row} style={{ paddingLeft: "1.4rem" }}>
                <Chip color="var(--accent)">⚒ {e.name}</Chip>{" "}
                <span className="mono" style={{ fontSize: "0.78rem", color: "var(--text-soft)" }}>
                  {JSON.stringify(e.arguments).slice(0, 90)}
                </span>
              </motion.div>
            )
          }
          if (e.type === "tool.result") {
            return (
              <motion.div
                key={key}
                {...row}
                className="mono"
                style={{ paddingLeft: "2rem", fontSize: "0.78rem", color: "var(--text-soft)" }}
              >
                {e.isError ? "✗" : "✓"} {e.output.slice(0, 120).replace(/\n/g, " ")}
              </motion.div>
            )
          }
          if (e.type === "agent.end") {
            return (
              <motion.div
                key={key}
                {...row}
                style={{ paddingLeft: "1.4rem", color: hue(e.agent), fontSize: "0.85rem" }}
              >
                ✓ {e.agent} complete
              </motion.div>
            )
          }
          if (e.type === "error") {
            return (
              <motion.div
                key={key}
                {...row}
                className="card"
                style={{ padding: "0.7rem 0.9rem", borderColor: "#c0392b", color: "#c0392b" }}
              >
                {e.error}
              </motion.div>
            )
          }
          return null
        })}
      </AnimatePresence>
      {running && (
        <motion.div {...row} style={{ paddingLeft: "1.4rem", color: "var(--text-soft)" }} className="mono">
          …streaming
        </motion.div>
      )}
    </div>
  )
}
