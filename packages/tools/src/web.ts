import type { Tool } from "@anomalithic/runtime"

const MAX_BYTES = 50_000

/** Strips tags from HTML for a rough text view. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Fetches a URL and returns its text (HTML reduced to readable text). */
export function webFetchTool(): Tool {
  return {
    name: "web_fetch",
    description: "Fetch a URL over HTTP(S) and return its text content.",
    parameters: {
      type: "object",
      properties: { url: { type: "string", description: "Absolute http(s) URL." } },
      required: ["url"],
    },
    async execute(args, ctx) {
      const url = String(args.url)
      if (!/^https?:\/\//i.test(url)) throw new Error("url must be an absolute http(s) URL")
      const res = await fetch(url, { signal: ctx.signal, headers: { "user-agent": "Anomalithic/0.1" } })
      if (!res.ok)
        return { title: `fetch ${url}`, output: `HTTP ${res.status}`, metadata: { status: res.status } }
      const ct = res.headers.get("content-type") ?? ""
      const raw = await res.text()
      const text = ct.includes("html") ? htmlToText(raw) : raw
      const truncated = text.length > MAX_BYTES
      return {
        title: `fetch ${url}`,
        output: truncated ? `${text.slice(0, MAX_BYTES)}\n…[truncated]` : text,
        metadata: { status: res.status, contentType: ct, truncated },
      }
    },
  }
}
