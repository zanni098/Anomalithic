"use client"

import { type AgentInfo, type RuntimeEvent, createClient } from "@anomalithic/sdk"
import { useCallback, useRef, useState } from "react"

const RUNTIME_URL = process.env.NEXT_PUBLIC_RUNTIME_URL ?? "http://127.0.0.1:4517"

export interface SwarmState {
  events: RuntimeEvent[]
  running: boolean
  error: string | null
  finalText: string
}

/** Streams a `/swarm` (or `/run`) trace from the runtime server into React state. */
export function useSwarm() {
  const client = useRef(createClient(RUNTIME_URL))
  const abort = useRef<AbortController | null>(null)
  const [state, setState] = useState<SwarmState>({ events: [], running: false, error: null, finalText: "" })

  const start = useCallback(
    async (mode: "swarm" | "run", goal: string, provider?: string, model?: string) => {
      abort.current?.abort()
      const ctrl = new AbortController()
      abort.current = ctrl
      setState({ events: [], running: true, error: null, finalText: "" })

      const onEvent = (e: RuntimeEvent) => {
        setState((s) => ({
          ...s,
          events: [...s.events, e],
          finalText: e.type === "done" ? e.text : s.finalText,
        }))
      }

      try {
        const input = mode === "swarm" ? { goal, provider, model } : { prompt: goal, provider, model }
        await (mode === "swarm"
          ? client.current.swarm(input as { goal: string }, onEvent, ctrl.signal)
          : client.current.run(input as { prompt: string }, onEvent, ctrl.signal))
        setState((s) => ({ ...s, running: false }))
      } catch (err) {
        setState((s) => ({
          ...s,
          running: false,
          error: err instanceof Error ? err.message : String(err),
        }))
      }
    },
    [],
  )

  const stop = useCallback(() => {
    abort.current?.abort()
    setState((s) => ({ ...s, running: false }))
  }, [])

  return { ...state, start, stop }
}

/** Loads the agent roster once for display. */
export async function fetchAgents(): Promise<AgentInfo[]> {
  try {
    return await createClient(RUNTIME_URL).agents()
  } catch {
    return []
  }
}

export async function checkRuntime(): Promise<boolean> {
  try {
    return (await createClient(RUNTIME_URL).health()).ok
  } catch {
    return false
  }
}
