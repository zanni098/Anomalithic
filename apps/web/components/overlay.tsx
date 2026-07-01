"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Monolith } from "./graphics"

// ── Toasts ────────────────────────────────────────────────────────────────────
// A tiny module-level store so any component can fire a toast without context wiring.

export type ToastKind = "info" | "success" | "error"
interface Toast {
  id: number
  kind: ToastKind
  message: string
}

let counter = 0
const listeners = new Set<(t: Toast[]) => void>()
let toasts: Toast[] = []

function publish() {
  for (const l of listeners) l(toasts)
}

export function toast(message: string, kind: ToastKind = "info") {
  const t: Toast = { id: ++counter, kind, message }
  toasts = [...toasts, t]
  publish()
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id)
    publish()
  }, 4200)
}

const KIND_ACCENT: Record<ToastKind, string> = {
  info: "var(--accent)",
  success: "#4caf7d",
  error: "#c0392b",
}

/** Renders the active toasts, bottom-right, with choreographed enter/exit. */
export function Toaster() {
  const [items, setItems] = useState<Toast[]>([])
  useEffect(() => {
    listeners.add(setItems)
    return () => {
      listeners.delete(setItems)
    }
  }, [])
  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, display: "flex", flexDirection: "column", gap: 10, zIndex: 1000 }}>
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="card"
            style={{ padding: "0.7rem 1rem", display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 220, boxShadow: "var(--shadow-lg)" }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 99, background: KIND_ACCENT[t.kind], boxShadow: `0 0 10px ${KIND_ACCENT[t.kind]}` }} />
            <span style={{ fontSize: "0.9rem" }}>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

/** A bespoke, animated modal with a backdrop blur and the monolith motif. */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    if (open) window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1001,
            display: "grid",
            placeItems: "center",
            padding: "1.5rem",
            background: "color-mix(in oklab, var(--ink-900) 45%, transparent)",
            backdropFilter: "blur(6px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ width: "min(520px, 100%)", padding: "1.6rem", boxShadow: "var(--shadow-lg)", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: -30, right: -20, opacity: 0.12 }}>
              <Monolith size={120} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.4rem" }}>{title}</h3>
              <button type="button" className="btn" style={{ padding: "0.35rem 0.6rem" }} onClick={onClose} aria-label="Close">
                ✕
              </button>
            </div>
            <div style={{ position: "relative" }}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
