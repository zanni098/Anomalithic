"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

/** The brand mark: an "abnormal stone" monolith with a dotted face + accent edge. */
export function Monolith({ size = 64, thinking = false }: { size?: number; thinking?: boolean }) {
  return (
    <motion.svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 64 84"
      fill="none"
      aria-hidden
      animate={thinking ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={thinking ? { duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } : {}}
    >
      <defs>
        <linearGradient id="mono-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a241b" />
          <stop offset="1" stopColor="#0f0c08" />
        </linearGradient>
        <pattern id="mono-dots" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="1.1" fill="rgba(219,117,68,0.22)" />
        </pattern>
      </defs>
      {/* accent glow edge */}
      <path
        d="M14 10 Q32 0 50 10 L52 80 Q32 86 12 80 Z"
        fill="#db7544"
        opacity="0.5"
        transform="translate(1.5 1.5)"
      />
      {/* slab */}
      <path
        d="M14 10 Q32 0 50 10 L52 80 Q32 86 12 80 Z"
        fill="url(#mono-face)"
        stroke="#000"
        strokeOpacity="0.4"
      />
      <path d="M14 10 Q32 0 50 10 L52 80 Q32 86 12 80 Z" fill="url(#mono-dots)" />
      {/* a single bright fracture line */}
      <path
        d="M30 14 L36 44 L28 52 L34 78"
        stroke="#db7544"
        strokeWidth="1.4"
        strokeOpacity="0.85"
        fill="none"
      />
    </motion.svg>
  )
}

/** Full "agent is thinking" state: breathing monolith + the ad-while-thinking placeholder. */
export function ThinkingState({ label = "thinking…" }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
      <Monolith size={26} thinking />
      <div style={{ display: "flex", gap: 5 }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            style={{ width: 7, height: 7, borderRadius: 99, background: "var(--accent)" }}
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
            transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY, delay: i * 0.18 }}
          />
        ))}
      </div>
      <span className="mono" style={{ fontSize: "0.8rem", color: "var(--text-soft)" }}>
        {label}
      </span>
    </div>
  )
}

/** Light/dark toggle persisted to localStorage. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  useEffect(() => {
    const saved = (localStorage.getItem("anom-theme") as "light" | "dark") || "light"
    setTheme(saved)
  }, [])
  const flip = () => {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    document.documentElement.dataset.theme = next
    localStorage.setItem("anom-theme", next)
  }
  return (
    <button
      type="button"
      className="btn"
      onClick={flip}
      aria-label="Toggle theme"
      style={{ padding: "0.5rem 0.7rem" }}
    >
      {theme === "light" ? "◐" : "◑"}
    </button>
  )
}
