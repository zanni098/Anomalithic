"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Monolith, ThemeToggle } from "../../components/graphics"
import { TraceView } from "../../components/trace"
import { checkRuntime, useSwarm } from "../../lib/useSwarm"

const PROVIDERS = ["free-router", "anthropic", "openai", "gemini", "ollama", "mock"]
const EXAMPLES = [
  "Research the Model Context Protocol and write a 3-sentence explainer",
  "Plan a product launch: research competitors, draft copy, outline a deck",
  "Analyze the tradeoffs of Tauri vs Electron and recommend one",
]

export default function ConsolePage() {
  const { events, running, error, finalText, start, stop } = useSwarm()
  const [goal, setGoal] = useState("")
  const [provider, setProvider] = useState("free-router")
  const [online, setOnline] = useState<boolean | null>(null)

  useEffect(() => {
    checkRuntime().then(setOnline)
  }, [])

  const submit = () => {
    if (goal.trim() && !running) start("swarm", goal.trim(), provider)
  }

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "1.5rem 1.5rem 6rem" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Monolith size={26} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
            Anomalithic
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className="tag" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: online === null ? "var(--stone-400)" : online ? "#4caf7d" : "#c0392b",
              }}
            />
            {online === null ? "checking runtime" : online ? "runtime online" : "runtime offline"}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", marginBottom: "0.4rem" }}
      >
        Swarm console
      </motion.h1>
      <p style={{ color: "var(--text-soft)", marginTop: 0, marginBottom: "1.4rem", maxWidth: 560 }}>
        Give the Orchestrator a goal. It plans, delegates to specialists, calls tools, and streams every step.
      </p>

      {/* Composer */}
      <div className="card" style={{ padding: "0.9rem", marginBottom: "1.5rem" }}>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit()
          }}
          placeholder="What should the swarm accomplish?"
          rows={2}
          style={{
            width: "100%",
            resize: "vertical",
            border: "none",
            background: "transparent",
            color: "var(--text)",
            fontFamily: "var(--font-body)",
            fontSize: "1.05rem",
            outline: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: "0.6rem",
            alignItems: "center",
            marginTop: "0.6rem",
            flexWrap: "wrap",
          }}
        >
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="mono"
            style={{
              padding: "0.5rem 0.6rem",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--line-strong)",
              background: "var(--bg-sunken)",
              color: "var(--text)",
              fontSize: "0.8rem",
            }}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <div style={{ flex: 1 }} />
          {running ? (
            <button type="button" className="btn" onClick={stop}>
              Stop
            </button>
          ) : (
            <button type="button" className="btn btn-accent" onClick={submit} disabled={!goal.trim()}>
              Run swarm ⌘↵
            </button>
          )}
        </div>
      </div>

      {/* Empty / onboarding state */}
      {events.length === 0 && !running && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: "center", padding: "2.5rem 1rem" }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <Monolith size={56} />
          </div>
          <p style={{ color: "var(--text-soft)", marginBottom: "1rem" }}>Try one of these:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                className="btn"
                style={{ fontSize: "0.85rem" }}
                onClick={() => setGoal(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
          {online === false && (
            <p className="mono" style={{ marginTop: "1.5rem", color: "#c0392b", fontSize: "0.8rem" }}>
              Runtime offline — start it with <code>anomalithic serve</code> (port 4517).
            </p>
          )}
        </motion.div>
      )}

      {/* Live trace */}
      {(events.length > 0 || running) && (
        <div className="card" style={{ padding: "1.2rem 1.4rem" }}>
          <TraceView events={events} running={running} />
        </div>
      )}

      {/* Final answer */}
      {finalText && !running && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ padding: "1.4rem 1.6rem", marginTop: "1.2rem", borderColor: "var(--accent)" }}
        >
          <div className="tag" style={{ marginBottom: "0.5rem", color: "var(--accent)" }}>
            Final answer
          </div>
          <p style={{ margin: 0, fontSize: "1.1rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {finalText}
          </p>
        </motion.div>
      )}

      {error && (
        <div
          className="card"
          style={{ padding: "1rem", marginTop: "1rem", borderColor: "#c0392b", color: "#c0392b" }}
        >
          {error}
        </div>
      )}
    </main>
  )
}
