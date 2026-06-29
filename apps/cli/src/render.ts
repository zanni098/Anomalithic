import type { EventBus } from "@anomalithic/runtime"

const DIM = "\x1b[2m"
const RESET = "\x1b[0m"
const ACCENT = "\x1b[38;5;173m" // warm terracotta

/**
 * Renders the runtime event stream to the terminal: a thinking marker, streamed
 * text, tool calls, and a final summary line. Pure subscriber — never touches the loop.
 */
export function renderTrace(bus: EventBus): void {
  let usageIn = 0
  let usageOut = 0
  let impressions = 0

  bus.on("thinking.start", () => {
    impressions++
    process.stdout.write(`${DIM}✦ thinking…${RESET}\n`)
  })
  bus.on("text", (e) => {
    process.stdout.write(e.text)
  })
  bus.on("tool.call", (e) => {
    process.stdout.write(`\n${ACCENT}→ ${e.name}(${JSON.stringify(e.arguments)})${RESET}\n`)
  })
  bus.on("tool.result", (e) => {
    const preview = e.output.length > 200 ? `${e.output.slice(0, 200)}…` : e.output
    process.stdout.write(`${DIM}  ${e.isError ? "✗" : "✓"} ${preview}${RESET}\n`)
  })
  bus.on("usage", (e) => {
    usageIn += e.inputTokens
    usageOut += e.outputTokens
  })
  bus.on("done", () => {
    process.stdout.write(`\n${DIM}[${usageIn}+${usageOut} tokens, ${impressions} impression(s)]${RESET}\n`)
  })
}
