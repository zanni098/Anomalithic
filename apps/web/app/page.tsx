"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Monolith, ThemeToggle } from "../components/graphics"

const stagger = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const rise = {
  initial: { opacity: 0, y: 18, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const SPECIALISTS = [
  { name: "Researcher", hue: "#3a7ec2" },
  { name: "Coder", hue: "#4caf7d" },
  { name: "Analyst", hue: "#9b6dc2" },
  { name: "Writer", hue: "#c2a23a" },
  { name: "Slides", hue: "#c23a6d" },
  { name: "Docs", hue: "#3ac2b0" },
  { name: "Image", hue: "#c27d3a" },
  { name: "Video", hue: "#6d3ac2" },
]

const PILLARS = [
  {
    t: "Model-agnostic",
    d: "Free Models Router, Anthropic, OpenAI, Gemini, Ollama — one interface, swap freely.",
  },
  {
    t: "Real swarm",
    d: "An Orchestrator that never does the work itself — it delegates, runs parallel workstreams, and hands off.",
  },
  {
    t: "Visible thinking",
    d: "Every thinking window mints a signed impression. The trace is the product: think, call, hand off, answer.",
  },
]

export default function Home() {
  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "1.5rem" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "3rem",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Monolith size={24} />
          <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem" }}>Anomalithic</strong>
        </span>
        <nav style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link href="/console" className="btn" style={{ fontSize: "0.9rem" }}>
            Open console
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      {/* Hero */}
      <motion.section
        variants={stagger}
        initial="initial"
        animate="animate"
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: "2rem",
          alignItems: "center",
          padding: "2rem 0 4rem",
        }}
      >
        <div>
          <motion.span variants={rise} className="tag">
            open-core · model-agnostic · multi-agent
          </motion.span>
          <motion.h1
            variants={rise}
            style={{ fontSize: "clamp(2.6rem, 6vw, 4.6rem)", margin: "0.6rem 0 1rem" }}
          >
            One agent to
            <br />
            <span style={{ color: "var(--accent)", fontStyle: "italic" }}>rule them all.</span>
          </motion.h1>
          <motion.p
            variants={rise}
            style={{ fontSize: "1.2rem", color: "var(--text-soft)", maxWidth: 520, lineHeight: 1.6 }}
          >
            A premium harness around any model — a swarm of specialists, real tools, durable sessions, and a
            trace you can watch think.
          </motion.p>
          <motion.div variants={rise} style={{ display: "flex", gap: "0.8rem", marginTop: "1.8rem" }}>
            <Link
              href="/console"
              className="btn btn-accent"
              style={{ fontSize: "1rem", padding: "0.85rem 1.4rem" }}
            >
              Launch the swarm →
            </Link>
            <a
              href="https://github.com/zanni098/Anomalithic"
              target="_blank"
              rel="noreferrer"
              className="btn"
              style={{ fontSize: "1rem", padding: "0.85rem 1.4rem" }}
            >
              GitHub
            </a>
          </motion.div>
        </div>
        <motion.div variants={rise} style={{ display: "flex", justifyContent: "center" }}>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <Monolith size={150} />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Pillars */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
          marginBottom: "4rem",
        }}
      >
        {PILLARS.map((p, i) => (
          <motion.div
            key={p.t}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="card"
            style={{ padding: "1.4rem" }}
          >
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", marginBottom: "0.5rem" }}>
              {p.t}
            </div>
            <p style={{ color: "var(--text-soft)", margin: 0, lineHeight: 1.55 }}>{p.d}</p>
          </motion.div>
        ))}
      </section>

      {/* Roster */}
      <section style={{ marginBottom: "5rem" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>The roster</h2>
        <p style={{ color: "var(--text-soft)", marginTop: 0, marginBottom: "1.5rem" }}>
          An Orchestrator coordinates eight specialists.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.7rem" }}>
          {SPECIALISTS.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="card"
              style={{ padding: "0.7rem 1.1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 4,
                  background: s.hue,
                  boxShadow: `0 0 10px ${s.hue}`,
                }}
              />
              <span style={{ fontWeight: 560 }}>{s.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <footer
        style={{
          borderTop: "1px solid var(--line)",
          paddingTop: "1.5rem",
          color: "var(--text-soft)",
          fontSize: "0.85rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Built in the open · Apache-2.0 runtime</span>
        <span className="mono">v0.2.0</span>
      </footer>
    </main>
  )
}
