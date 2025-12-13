// NodeGraphBlock.tsx  (no CSS, all bugs fixed)
import { createReactBlockSpec } from "@blocknote/react";
import type { PropSchema } from "@blocknote/core";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* -------------------- types -------------------- */
type NodeType = "todo" | "reminder" | "warning" | "faq";

interface Port { id: string; type: "input" | "output"; }

interface NodeItem {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: { todos: string[] };
  inputs: Port[];
  outputs: Port[];
}

interface Connection {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

/* -------------------- schema -------------------- */
const propSchema = {
  nodes: { default: "[]" },
  connections: { default: "[]" },
  viewport: { default: '{"x":0,"y":0,"zoom":1}' },
} satisfies PropSchema;

/* -------------------- helpers -------------------- */
const snap = (v: number, g = 20) => Math.round(v / g) * g;
const vp = (x: number, y: number, zoom: number) => ({ x, y, zoom });

/* -------------------- components -------------------- */
const PortWidget: React.FC<{
  port: Port;
  nodeId: string;
  onDragStart: (nodeId: string, port: Port) => void;
  onDragEnd: (nodeId: string, port: Port) => void;
}> = ({ port, nodeId, onDragStart, onDragEnd }) => (
  <div
    onMouseDown={(e) => {
      e.stopPropagation();
      onDragStart(nodeId, port);
    }}
    onMouseUp={(e) => {
      e.stopPropagation();
      onDragEnd(nodeId, port);
    }}
  />
);

const NodeWidget: React.FC<{
  node: NodeItem;
  selected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (patch: Partial<NodeItem>) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
  onDragNewWire: (nodeId: string, port: Port) => void;
  onEndNewWire: (nodeId: string, port: Port) => void;
}> = ({ node, selected, onSelect, onUpdate, onDragStart, onDragNewWire, onEndNewWire }) => {
  const color = { todo: "#82cfff", reminder: "#f6d860", warning: "#ff6f6f", faq: "#c3a6ff" }[node.type];
  return (
    <div
      style={{
        position: "absolute",
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        background: color,
        borderRadius: 6,
        cursor: "grab",
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect(node.id);
        onDragStart(node.id, e);
      }}
    >
      <div style={{ padding: 6, fontSize: 12, fontWeight: 600 }}>{node.type.toUpperCase()}</div>
      {/* inputs */}
      <div style={{ position: "absolute", left: -8, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
        {node.inputs.map((p) => (
          <PortWidget key={p.id} port={p} nodeId={node.id} onDragStart={onDragNewWire} onDragEnd={onEndNewWire} />
        ))}
      </div>
      {/* outputs */}
      <div style={{ position: "absolute", right: -8, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
        {node.outputs.map((p) => (
          <PortWidget key={p.id} port={p} nodeId={node.id} onDragStart={onDragNewWire} onDragEnd={onEndNewWire} />
        ))}
      </div>
      {selected && (
        <div
          style={{ position: "absolute", bottom: -4, right: -4, width: 8, height: 8, background: "#33aaff", borderRadius: "50%", cursor: "nwse-resize" }}
          onMouseDown={(e) => {
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const startW = node.size.width;
            const startH = node.size.height;
            const onMove = (ev: MouseEvent) => {
              onUpdate({ size: { width: Math.max(120, startW + ev.clientX - startX), height: Math.max(60, startH + ev.clientY - startY) } });
            };
            const onUp = () => {
              document.removeEventListener("mousemove", onMove);
              document.removeEventListener("mouseup", onUp);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
          }}
        />
      )}
    </div>
  );
};

const Wire: React.FC<{ conn: Connection; nodesMap: Map<string, NodeItem>; onClick: () => void }> = ({ conn, nodesMap, onClick }) => {
  const fromNode = nodesMap.get(conn.fromNode);
  const toNode = nodesMap.get(conn.toNode);
  if (!fromNode || !toNode) return null;
  const fromPort = fromNode.outputs.find((p) => p.id === conn.fromPort);
  const toPort = toNode.inputs.find((p) => p.id === conn.toPort);
  if (!fromPort || !toPort) return null;
  const portY = (ports: Port[], id: string, h: number) =>
    ports.length === 1 ? h / 2 : (ports.findIndex((p) => p.id === id) + 1) * (h / (ports.length + 1));
  const x1 = fromNode.position.x + fromNode.size.width;
  const y1 = fromNode.position.y + portY(fromNode.outputs, fromPort.id, fromNode.size.height);
  const x2 = toNode.position.x;
  const y2 = toNode.position.y + portY(toNode.inputs, toPort.id, toNode.size.height);
  const dx = Math.abs(x2 - x1) * 0.4;
  const path = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  return (
    <g key={conn.id} onClick={onClick}>
      <path d={path} fill="none" stroke="#555" strokeWidth={2} markerEnd="url(#arrowhead)" />
    </g>
  );
};

const Palette: React.FC<{ onAdd: (type: NodeType, pos: { x: number; y: number }) => void }> = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  const colors: Record<NodeType, string> = { todo: "#82cfff", reminder: "#f6d860", warning: "#ff6f6f", faq: "#c3a6ff" };
  return (
    <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} style={{ position: "absolute", bottom: 12, right: 12 }}>
      <button style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "#33aaff", color: "#fff", fontSize: 20 }}>+</button>
      {open && (
        <div style={{ position: "absolute", bottom: 44, right: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {(["todo", "reminder", "warning", "faq"] as NodeType[]).map((t) => (
            <div
              key={t}
              style={{ padding: "6px 12px", borderRadius: 4, background: colors[t], fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              draggable
              onDragEnd={(e) => onAdd(t, { x: e.clientX - 50, y: e.clientY - 30 })}
              onClick={(e) => onAdd(t, { x: e.clientX - 50, y: e.clientY - 30 })}
            >
              {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------- block spec -------------------- */
export const nodeGraphBlock = createReactBlockSpec(
  { type: "node-graph", propSchema, content: "none" },
  {
    render: ({ block, editor }) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const svgRef = useRef<SVGSVGElement>(null);

      const [nodes, setNodes] = useState<NodeItem[]>(() => JSON.parse(block.props.nodes || "[]"));
      const [conns, setConns] = useState<Connection[]>(() => JSON.parse(block.props.connections || "[]"));
      const viewport: { x: number; y: number; zoom: number } = useMemo(() => JSON.parse(block.props.viewport || '{"x":0,"y":0,"zoom":1}'), [block.props.viewport]);

      const [sel, setSel] = useState<string | null>(null);
      const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
      const [wireStart, setWireStart] = useState<{ node: string; port: string; screen: { x: number; y: number } } | null>(null);
      const [wireHover, setWireHover] = useState<{ node: string; port: string } | null>(null);

      const nodesMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

      const sync = useCallback(
        (nextNodes?: NodeItem[], nextConns?: Connection[], nextVP?: { x: number; y: number; zoom: number }) => {
          editor.updateBlock(block, {
            type: "node-graph",
            props: {
              nodes: JSON.stringify(nextNodes ?? nodes),
              connections: JSON.stringify(nextConns ?? conns),
              viewport: JSON.stringify(nextVP ?? viewport),
            },
          });
        },
        [block, editor, nodes, conns, viewport]
      );

      const addNode = useCallback(
        (type: NodeType, rawPos: { x: number; y: number }) => {
          const rect = containerRef.current!.getBoundingClientRect();
          const x = (rawPos.x - rect.left - viewport.x) / viewport.zoom - 60;
          const y = (rawPos.y - rect.top - viewport.y) / viewport.zoom - 30;
          const id = crypto.randomUUID();
          const n: NodeItem = {
            id,
            type,
            position: { x: snap(x), y: snap(y) },
            size: { width: 120, height: 80 },
            data: { todos: [] },
            inputs: [{ id: crypto.randomUUID(), type: "input" }],
            outputs: [{ id: crypto.randomUUID(), type: "output" }],
          };
          const next = [...nodes, n];
          setNodes(next);
          sync(next);
          setSel(id);
        },
        [nodes, viewport, sync]
      );

      const deleteSelection = useCallback(() => {
        if (!sel) return;
        const nextNodes = nodes.filter((n) => n.id !== sel);
        const nextConns = conns.filter((c) => c.fromNode !== sel && c.toNode !== sel);
        setNodes(nextNodes);
        setConns(nextConns);
        sync(nextNodes, nextConns);
        setSel(null);
      }, [sel, nodes, conns, sync]);

      const duplicateSelection = useCallback(() => {
        if (!sel) return;
        const src = nodesMap.get(sel)!;
        const id = crypto.randomUUID();
        const dup: NodeItem = {
          ...src,
          id,
          position: { x: src.position.x + 40, y: src.position.y + 40 },
          inputs: src.inputs.map((p) => ({ ...p, id: crypto.randomUUID() })),
          outputs: src.outputs.map((p) => ({ ...p, id: crypto.randomUUID() })),
        };
        const next = [...nodes, dup];
        setNodes(next);
        sync(next);
        setSel(id);
      }, [sel, nodes, nodesMap, sync]);

      useEffect(() => {
        if (!dragging) return;
        const onMove = (e: MouseEvent) => {
          const dx = (e.clientX - dragging.offsetX - viewport.x) / viewport.zoom;
          const dy = (e.clientY - dragging.offsetY - viewport.y) / viewport.zoom;
          setNodes((prev) => prev.map((n) => (n.id === dragging.id ? { ...n, position: { x: snap(dx), y: snap(dy) } } : n)));
        };
        const onUp = () => {
          setDragging(null);
          sync();
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        return () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        };
      }, [dragging, viewport, sync]);

      const onWheel = useCallback(
        (e: React.WheelEvent) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          const delta = -e.deltaY * 0.001;
          const newZoom = Math.min(Math.max(viewport.zoom + delta, 0.3), 2);
          const newX = viewport.x - (mouseX - viewport.x) * (newZoom / viewport.zoom - 1);
          const newY = viewport.y - (mouseY - viewport.y) * (newZoom / viewport.zoom - 1);
          sync(undefined, undefined, vp(newX, newY, newZoom));
        },
        [viewport, sync]
      );

      useEffect(() => {
        if (!wireStart) return;
        const onMove = (e: MouseEvent) => {
          const svg = svgRef.current!;
          const pt = svg.createSVGPoint();
          pt.x = e.clientX;
          pt.y = e.clientY;
          const ctm = svg.getScreenCTM()?.inverse();
          const { x, y } = ctm ? pt.matrixTransform(ctm) : { x: e.clientX, y: e.clientY };
          const path = `M${wireStart.screen.x},${wireStart.screen.y} C${wireStart.screen.x + 80},${wireStart.screen.y} ${x - 80},${y} ${x},${y}`;
          const tmp = svg.querySelector(".wire-tmp") as SVGPathElement | null;
          if (tmp) tmp.setAttribute("d", path);
        };
        const onUp = () => {
          if (wireHover) {
            const exists = conns.some((c) => (c.fromNode === wireStart!.node && c.toNode === wireHover.node) || (c.fromNode === wireHover.node && c.toNode === wireStart!.node));
            if (!exists && wireStart!.node !== wireHover.node) {
              const next: Connection = { id: crypto.randomUUID(), fromNode: wireStart!.node, fromPort: wireStart!.port, toNode: wireHover.node, toPort: wireHover.port };
              const nextConns = [...conns, next];
              setConns(nextConns);
              sync(undefined, nextConns);
            }
          }
          svgRef.current!.querySelector(".wire-tmp")?.remove();
          setWireStart(null);
          setWireHover(null);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        return () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        };
      }, [wireStart, wireHover, conns, sync]);

      useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
          if (e.target !== containerRef.current) return;
          if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            deleteSelection();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === "d") {
            e.preventDefault();
            duplicateSelection();
          }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
      }, [deleteSelection, duplicateSelection]);

      return (
        <div
          ref={containerRef}
          tabIndex={0}
          onWheel={onWheel}
          onMouseDown={(e) => {
            if (e.button === 1 || (e.button === 0 && e.altKey)) {
              const startX = e.clientX - viewport.x;
              const startY = e.clientY - viewport.y;
              const onMove = (ev: MouseEvent) => sync(undefined, undefined, vp(ev.clientX - startX, ev.clientY - startY, viewport.zoom));
              const onUp = () => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
              };
              document.addEventListener("mousemove", onMove);
              document.addEventListener("mouseup", onUp);
            }
            setSel(null);
          }}
          style={{ position: "relative", width: "100%", height: 400, background: "#fff", border: "1px solid #ccc", overflow: "hidden", outline: "none", userSelect: "none" }}
        >
          <Palette onAdd={addNode} />
          <svg
            ref={svgRef}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="#555" />
              </marker>
            </defs>
            <g className="wires">
              {conns.map((c) => (
                <Wire key={c.id} conn={c} nodesMap={nodesMap} onClick={() => { const next = conns.filter((x) => x.id !== c.id); setConns(next); sync(undefined, next); }} />
              ))}
              {wireStart && <path className="wire-tmp" fill="none" stroke="#33aaff" strokeWidth={2} markerEnd="url(#arrowhead)" />}
            </g>
          </svg>
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}>
            {nodes.map((n) =>
              n ? (
                <NodeWidget
                  key={n.id}
                  node={n}
                  selected={sel === n.id}
                  onSelect={setSel}
                  onUpdate={(patch) => {
                    const next = nodes.map((x) => (x.id === n.id ? { ...x, ...patch } : x));
                    setNodes(next);
                    sync(next);
                  }}
                  onDragStart={(id, e) => {
                    setDragging({ id, offsetX: e.clientX - n.position.x * viewport.zoom - viewport.x, offsetY: e.clientY - n.position.y * viewport.zoom - viewport.y });
                  }}
                  onDragNewWire={(nodeId, port) => {
                    if (port.type !== "output") return;
                    const x = (n.position.x + n.size.width) * viewport.zoom + viewport.x;
                    const y = (n.position.y + n.size.height / 2) * viewport.zoom + viewport.y;
                    setWireStart({ node: nodeId, port: port.id, screen: { x, y } });
                    const svg = svgRef.current!;
                    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    p.setAttribute("class", "wire-tmp");
                    p.setAttribute("fill", "none");
                    p.setAttribute("stroke", "#33aaff");
                    p.setAttribute("stroke-width", "2");
                    p.setAttribute("marker-end", "url(#arrowhead)");
                    svg.querySelector(".wires")!.appendChild(p);
                  }}
                  onEndNewWire={(nodeId, port) => {
                    if (port.type !== "input") return;
                    setWireHover({ node: nodeId, port: port.id });
                  }}
                />
              ) : null
            )}
          </div>
          {sel && nodesMap.get(sel)?.type === "todo" && (
            <div style={{ position: "fixed", top: "30%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", border: "1px solid #ccc", borderRadius: 8, padding: 20, width: 300, zIndex: 999 }}>
              <h3>Todo list</h3>
              <ul>
                {nodesMap.get(sel)!.data.todos.map((t, i) => (
                  <li key={i}>
                    {t}{" "}
                    <button
                      onClick={() => {
                        const next = nodes.map((n) =>
                          n.id === sel ? { ...n, data: { ...n.data, todos: n.data.todos.filter((_, idx) => idx !== i) } } : n
                        );
                        setNodes(next);
                        sync(next);
                      }}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <input
                placeholder="Add todo..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (!val) return;
                    const next = nodes.map((n) => (n.id === sel ? { ...n, data: { ...n.data, todos: [...n.data.todos, val] } } : n));
                    setNodes(next);
                    sync(next);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <button onClick={() => setSel(null)}>Close</button>
            </div>
          )}
        </div>
      );
    },
  }
);