import type { EventBus } from "@anomalithic/runtime"

const DIM = "\x1b[2m"
const RESET = "\x1b[0m"
const ACCENT = "\x1b[38;5;173m" // warm terracotta
const BLUE = "\x1b[38;5;75m"
const GREEN = "\x1b[38;5;71m"

/** Coordination tools are surfaced via dedicated delegate/handoff events, not raw tool lines. */
const COORDINATION = new Set(["delegate", "delegate_parallel", "handoff"])

/**
 * Renders the runtime event stream to the terminal: thinking markers, streamed text,
 * tool calls, and multi-agent handoffs. Pure subscriber — never touches the loop.
 */
export function renderTrace(bus: EventBus): void {
  let usageIn = 0
  let usageOut = 0
  let impressions = 0

  bus.on("agent.start", (e) => {
    process.stdout.write(`\n${ACCENT}◆ ${e.agent}${RESET} ${DIM}(${e.role})${RESET}\n`)
  })
  bus.on("delegate", (e) => {
    process.stdout.write(`${BLUE}  ↳ delegate → ${e.to}${RESET} ${DIM}${e.task.slice(0, 70)}${RESET}\n`)
  })
  bus.on("handoff", (e) => {
    process.stdout.write(`${BLUE}  ⇄ handoff → ${e.to}${RESET}\n`)
  })
  bus.on("agent.end", (e) => {
    process.stdout.write(
      `${GREEN}  ✓ ${e.agent}${RESET} ${DIM}${e.summary.slice(0, 80).replace(/\n/g, " ")}${RESET}\n`,
    )
  })
  bus.on("thinking.start", () => {
    impressions++
    process.stdout.write(`${DIM}✦ thinking…${RESET}\n`)
  })
  bus.on("text", (e) => {
    process.stdout.write(e.text)
  })
  bus.on("tool.call", (e) => {
    if (COORDINATION.has(e.name)) return
    process.stdout.write(`\n${ACCENT}→ ${e.name}(${JSON.stringify(e.arguments)})${RESET}\n`)
  })
  bus.on("tool.result", (e) => {
    if (COORDINATION.has(e.name)) return
    const preview = e.output.length > 200 ? `${e.output.slice(0, 200)}…` : e.output
    process.stdout.write(`${DIM}  ${e.isError ? "✗" : "✓"} ${preview.replace(/\n/g, " ")}${RESET}\n`)
  })
  bus.on("usage", (e) => {
    usageIn += e.inputTokens
    usageOut += e.outputTokens
  })
  bus.on("done", () => {
    process.stdout.write(`\n${DIM}[${usageIn}+${usageOut} tokens, ${impressions} impression(s)]${RESET}\n`)
  })
}
