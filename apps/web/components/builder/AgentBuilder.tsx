"use client";

import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  Handle,
  MiniMap,
  type Node,
  type NodeProps,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type NodeKind = "provider" | "prompt" | "tool" | "code" | "subagent" | "output";

interface AgentNodeData extends Record<string, unknown> {
  kind: NodeKind;
  value: string;
}

const META: Record<NodeKind, { label: string; hint: string; placeholder: string; multiline: boolean }> = {
  provider: { label: "Provider", hint: "model backend", placeholder: "claude-sonnet-4-6", multiline: false },
  prompt: { label: "Prompt", hint: "system instruction", placeholder: "You are a careful research agent…", multiline: true },
  tool: { label: "Tool", hint: "a capability", placeholder: "web_search", multiline: false },
  code: { label: "Code", hint: "inline step (JS)", placeholder: "return input.trim()", multiline: true },
  subagent: { label: "Subagent", hint: "spawned worker", placeholder: "summarize the findings", multiline: true },
  output: { label: "Output", hint: "final answer", placeholder: "", multiline: false },
};

const COLOR: Record<NodeKind, string> = {
  provider: "#b8502d",
  prompt: "#5b6b54",
  tool: "#3f6075",
  code: "#7a5b8a",
  subagent: "#b8862d",
  output: "#211f1a",
};

const PALETTE: NodeKind[] = ["provider", "prompt", "tool", "code", "subagent", "output"];

// Context so the (stable) node type can update its own field without stale closures.
const UpdateCtx = createContext<(id: string, value: string) => void>(() => {});

function AgentNode({ id, data }: NodeProps<Node<AgentNodeData>>) {
  const update = useContext(UpdateCtx);
  const meta = META[data.kind];
  const accent = COLOR[data.kind];
  return (
    <div
      style={{
        width: 220,
        background: "#fbf9f4",
        border: `1px solid ${accent}`,
        borderRadius: 10,
        overflow: "hidden",
        fontFamily: "var(--font-sans), sans-serif",
        boxShadow: "0 8px 24px -16px rgba(33,31,26,0.4)",
      }}
    >
      {data.kind !== "provider" && <Handle type="target" position={Position.Left} />}
      {data.kind !== "output" && <Handle type="source" position={Position.Right} />}
      <div style={{ background: accent, color: "#fbf9f4", padding: "6px 11px", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>{meta.label}</span>
        <span style={{ fontSize: "0.66rem", opacity: 0.8, fontFamily: "var(--font-mono), monospace" }}>{data.kind}</span>
      </div>
      <div style={{ padding: 10 }}>
        {data.kind === "output" ? (
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#57534a" }}>{meta.hint}</p>
        ) : meta.multiline ? (
          <textarea
            value={data.value}
            onChange={(e) => update(id, e.target.value)}
            placeholder={meta.placeholder}
            rows={3}
            className="nodrag"
            style={textStyle}
          />
        ) : (
          <input
            value={data.value}
            onChange={(e) => update(id, e.target.value)}
            placeholder={meta.placeholder}
            className="nodrag"
            style={textStyle}
          />
        )}
      </div>
    </div>
  );
}

const textStyle: React.CSSProperties = {
  width: "100%",
  resize: "vertical",
  border: "1px solid rgba(33,31,26,0.14)",
  borderRadius: 6,
  padding: "6px 8px",
  fontSize: "0.78rem",
  fontFamily: "var(--font-mono), monospace",
  background: "#f5f2ea",
  color: "#211f1a",
  outline: "none",
};

let counter = 4;

const INITIAL_NODES: Node<AgentNodeData>[] = [
  { id: "1", type: "agent", position: { x: 20, y: 40 }, data: { kind: "provider", value: "claude-sonnet-4-6" } },
  { id: "2", type: "agent", position: { x: 290, y: 30 }, data: { kind: "prompt", value: "You are a careful research agent. Cite sources." } },
  { id: "3", type: "agent", position: { x: 290, y: 200 }, data: { kind: "tool", value: "web_search" } },
  { id: "out", type: "agent", position: { x: 580, y: 110 }, data: { kind: "output", value: "" } },
];
const INITIAL_EDGES: Edge[] = [
  { id: "e1", source: "1", target: "2" },
  { id: "e2", source: "2", target: "out" },
  { id: "e3", source: "3", target: "2" },
];

function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<AgentNodeData>>(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(INITIAL_EDGES);
  const [exported, setExported] = useState<string>("");
  const { screenToFlowPosition } = useReactFlow();
  const wrapRef = useRef<HTMLDivElement>(null);

  const update = useCallback(
    (id: string, value: string) => {
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, value } } : n)));
    },
    [setNodes],
  );

  const onConnect = useCallback((c: Connection) => setEdges((eds) => addEdge(c, eds)), [setEdges]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData("application/anomalithic") as NodeKind;
      if (!kind) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      counter += 1;
      setNodes((nds) =>
        nds.concat({ id: `n${counter}`, type: "agent", position, data: { kind, value: "" } }),
      );
    },
    [screenToFlowPosition, setNodes],
  );

  const exportDef = useCallback(() => {
    const def = {
      version: 1,
      nodes: nodes.map((n) => ({ id: n.id, kind: n.data.kind, value: n.data.value })),
      edges: edges.map((e) => ({ from: e.source, to: e.target })),
    };
    setExported(JSON.stringify(def, null, 2));
  }, [nodes, edges]);

  const nodeTypes = useMemo(() => ({ agent: AgentNode }), []);

  return (
    <UpdateCtx.Provider value={update}>
      <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 14 }}>
        <aside>
          <div className="mono" style={{ fontSize: "0.68rem", letterSpacing: "0.12em", color: "var(--ink-faint)", marginBottom: 10 }}>
            DRAG ONTO CANVAS
          </div>
          {PALETTE.map((k) => (
            <div
              key={k}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("application/anomalithic", k)}
              style={{
                marginBottom: 8,
                padding: "9px 11px",
                borderRadius: 8,
                border: `1px solid ${COLOR[k]}`,
                background: "var(--paper)",
                cursor: "grab",
                fontSize: "0.84rem",
              }}
            >
              <span style={{ color: COLOR[k], fontWeight: 600 }}>{META[k].label}</span>
              <div style={{ color: "var(--ink-soft)", fontSize: "0.72rem" }}>{META[k].hint}</div>
            </div>
          ))}
        </aside>

        <div ref={wrapRef} style={{ height: "66vh", minHeight: 460, border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", background: "var(--paper)" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(33,31,26,0.18)" />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor={(n) => COLOR[(n.data as AgentNodeData).kind] ?? "#999"} />
            <Panel position="top-right">
              <button className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem" }} onClick={exportDef}>
                Export agent
              </button>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {exported && (
        <div className="card" style={{ marginTop: 18, background: "#1c1b17", borderColor: "#3a382f" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span className="mono" style={{ color: "#d8a657", fontSize: "0.78rem" }}>agent.json</span>
            <button className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: "0.78rem", color: "#e7e3d8", borderColor: "#3a382f" }} onClick={() => navigator.clipboard?.writeText(exported)}>
              Copy
            </button>
          </div>
          <pre style={{ margin: 0, color: "#e7e3d8", fontFamily: "var(--font-mono), monospace", fontSize: "0.78rem", overflowX: "auto" }}>
            {exported}
          </pre>
        </div>
      )}
    </UpdateCtx.Provider>
  );
}

export function AgentBuilder() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
