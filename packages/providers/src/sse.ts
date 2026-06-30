/**
 * Minimal Server-Sent-Events line reader over a fetch Response body. Yields the
 * `data:` payload of each event (already stripped). Stops on the `[DONE]` sentinel.
 * Provider-agnostic: used by every OpenAI-compatible and Anthropic stream parser.
 */
export async function* readSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let nl = buffer.indexOf("\n")
      while (nl !== -1) {
        const line = buffer.slice(0, nl).replace(/\r$/, "")
        buffer = buffer.slice(nl + 1)
        nl = buffer.indexOf("\n")
        if (!line.startsWith("data:")) continue
        const data = line.slice(5).trim()
        if (data === "[DONE]") return
        if (data) yield data
      }
    }
  } finally {
    reader.releaseLock()
  }
}
