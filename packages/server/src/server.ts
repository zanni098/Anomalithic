import {
  type IncomingMessage,
  type Server,
  type ServerResponse,
  createServer as createHttpServer,
} from "node:http"
import { join } from "node:path"
import {
  DEFAULT_MODELS,
  type ProviderId,
  buildProvider,
  resolveDefaultProviderId,
} from "@anomalithic/providers"
import {
  EventBus as Bus,
  type EventBus,
  type Provider,
  type Tool,
  generateImpressionKey,
} from "@anomalithic/runtime"
import { runAgent } from "@anomalithic/runtime"
import { SessionStore } from "@anomalithic/sessions"
import { type AgentDefinition, DEFAULT_ROSTER, runSwarm } from "@anomalithic/swarm"
import { builtinTools } from "@anomalithic/tools"

export interface RuntimeServerOptions {
  workspaceRoot?: string
  sessionDir?: string
  impressionKey?: string
}

interface RunBody {
  prompt?: string
  goal?: string
  provider?: string
  model?: string
}

function cors(res: ServerResponse): void {
  res.setHeader("access-control-allow-origin", "*")
  res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS")
  res.setHeader("access-control-allow-headers", "content-type")
}

function json(res: ServerResponse, body: unknown, status = 200): void {
  res.writeHead(status, { "content-type": "application/json" })
  res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage): Promise<RunBody> {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  const raw = Buffer.concat(chunks).toString("utf8")
  return raw ? (JSON.parse(raw) as RunBody) : {}
}

/** Streams a runtime EventBus to the client as Server-Sent Events. */
async function streamSSE(res: ServerResponse, run: (bus: EventBus) => Promise<unknown>): Promise<void> {
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
    "access-control-allow-origin": "*",
  })
  const bus = new Bus()
  const unsub = bus.onAny((event) => res.write(`data: ${JSON.stringify(event)}\n\n`))
  try {
    await run(bus)
  } catch (err) {
    res.write(
      `data: ${JSON.stringify({ type: "error", error: err instanceof Error ? err.message : String(err) })}\n\n`,
    )
  } finally {
    unsub()
    res.end()
  }
}

/**
 * The local runtime API: one HTTP server the web app, desktop app, and CLI all talk
 * to. `/run` and `/swarm` stream the trace as SSE — the same RuntimeEvents the UI renders.
 */
export function createRuntimeServer(opts: RuntimeServerOptions = {}): Server {
  const workspaceRoot = opts.workspaceRoot ?? process.cwd()
  const impressionKey = opts.impressionKey ?? generateImpressionKey()
  const sessions = new SessionStore(opts.sessionDir ?? join(workspaceRoot, ".anomalithic", "sessions"))
  const allTools = builtinTools({ workspaceRoot, web: true, shell: true })
  const toolsFor = (a: AgentDefinition): Tool[] =>
    a.toolNames ? allTools.filter((t) => a.toolNames?.includes(t.name)) : []

  function resolve(body: RunBody): { provider: Provider; model: string } {
    const id = (body.provider ?? resolveDefaultProviderId()) as ProviderId
    return { provider: buildProvider(id), model: body.model ?? DEFAULT_MODELS[id] }
  }

  return createHttpServer(async (req, res) => {
    cors(res)
    if (req.method === "OPTIONS") {
      res.writeHead(204)
      res.end()
      return
    }
    const url = new URL(req.url ?? "/", "http://localhost")
    try {
      if (req.method === "GET" && url.pathname === "/health")
        return json(res, { ok: true, name: "anomalithic", version: "0.2.0" })
      if (req.method === "GET" && url.pathname === "/agents") {
        return json(res, { agents: DEFAULT_ROSTER.map(({ systemPrompt: _p, ...rest }) => rest) })
      }
      if (req.method === "GET" && url.pathname === "/sessions")
        return json(res, { sessions: await sessions.list() })
      if (req.method === "POST" && url.pathname === "/run") {
        const body = await readBody(req)
        const { provider, model } = resolve(body)
        return streamSSE(res, (bus) =>
          runAgent({
            provider,
            model,
            messages: [{ role: "user", content: String(body.prompt ?? "") }],
            tools: allTools,
            impressionKey,
            bus,
          }),
        )
      }
      if (req.method === "POST" && url.pathname === "/swarm") {
        const body = await readBody(req)
        const { provider, model } = resolve(body)
        return streamSSE(res, (bus) =>
          runSwarm({
            provider,
            model,
            task: String(body.goal ?? ""),
            agents: DEFAULT_ROSTER,
            toolsFor,
            impressionKey,
            bus,
          }),
        )
      }
      json(res, { error: "not found" }, 404)
    } catch (err) {
      json(res, { error: err instanceof Error ? err.message : String(err) }, 500)
    }
  })
}

/** Starts the runtime server and resolves once it is listening. */
export function startRuntimeServer(port: number, opts: RuntimeServerOptions = {}): Promise<Server> {
  const server = createRuntimeServer(opts)
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)))
}
