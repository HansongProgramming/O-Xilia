// NodeGraphBlock.tsx
import { createReactBlockSpec } from "@blocknote/react";
import type { PropSchema } from "@block-note/core";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { FC, MouseEvent, WheelEvent, KeyboardEvent } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type NodeType = "todo" | "reminder" | "warning" | "faq";

interface Port {
  id: string;
  type: "input" | "output";
}

interface NodeItem {
  id: string;
  type: NodeType;
  position: { x: number; y: number }; // top-left
  size: { width: number; height: number };
  data: {
    todos: string[];
  };
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

/* ------------------------------------------------------------------ */
/* BlockNote schema                                                   */
/* ------------------------------------------------------------------ */
const propSchema = {
  nodes: { default: "[]" },
  connections: { default: "[]" },
  viewport: { default: '{"x":0,"y":0,"zoom":1}' },
} satisfies PropSchema;

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const snap = (v: number, g = 20) => Math.round(v / g) * g;
const dist2 = (a: [number, number], b: [number, number]) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

/* ------------------------------------------------------------------ */
/* Node colours (n8n pastel)                                          */
/* ------------------------------------------------------------------ */
const nodeColors: Record<NodeType, string> = {
  todo: "#82cfff",
  reminder: "#f6d860",
  warning: "#ff6f6f",
  faq: "#c3a6ff",
};

/* ------------------------------------------------------------------ */
/* Port component                                                     */
/* ------------------------------------------------------------------ */
const PortWidget: FC<{
  port: Port;
  nodeId: string;
  onDragStart: (nodeId: string, port: Port) => void;
  onDragEnd: (nodeId: string, port: Port) => void;
  onHover: (p: { x: number; y: number } | null) => void;
}> = ({ port, nodeId, onDragStart, onDragEnd, onHover }) => {
  return (
    <div
      className="node-port"
      data-type={port.type}
      onMouseDown={(e) => {
        e.stopPropagation();
        onDragStart(nodeId, port);
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        onDragEnd(nodeId, port);
      }}
      onMouseEnter={(e) => {
        const rect = (e.target as HTMLDivElement).getBoundingClientRect();
        onHover({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }}
      onMouseLeave={() => onHover(null)}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Node component                                                     */
/* ------------------------------------------------------------------ */
const NodeWidget: FC<{
  node: NodeItem;
  selected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (n: Partial<NodeItem>) => void;
  onDragStart: (id: string, e: MouseEvent) => void;
  onDragNewWire: (nodeId: string, port: Port) => void;
  onEndNewWire: (nodeId: string, port: Port) => void;
  onPortHover: (p: { x: number; y: number } | null) => void;
}> = ({
  node,
  selected,
  onSelect,
  onUpdate,
  onDragStart,
  onDragNewWire,
  onEndNewWire,
  onPortHover,
}) => {
  const color = nodeColors[node.type];
  return (
    <div
      className={`node ${selected ? "selected" : ""}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        background: color,
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect(node.id);
        onDragStart(node.id, e);
      }}
    >
      <div className="node-title">{node.type.toUpperCase()}</div>

      {/* input ports */}
      <div className="node-ports node-ports-inputs">
        {node.inputs.map((p) => (
          <PortWidget
            key={p.id}
            port={p}
            nodeId={node.id}
            onDragStart={onDragNewWire}
            onDragEnd={onEndNewWire}
            onHover={onPortHover}
          />
        ))}
      </div>

      {/* output ports */}
      <div className="node-ports node-ports-outputs">
        {node.outputs.map((p) => (
          <PortWidget
            key={p.id}
            port={p}
            nodeId={node.id}
            onDragStart={onDragNewWire}
            onDragEnd={onEndNewWire}
            onHover={onPortHover}
          />
        ))}
      </div>

      {selected && (
        <>
          {/* resize handles */}
          <div
            className="resize-handle resize-se"
            onMouseDown={(e) => {
              e.stopPropagation();
              const startX = e.clientX;
              const startY = e.clientY;
              const startW = node.size.width;
              const startH = node.size.height;
              const move = (ev: MouseEvent) => {
                onUpdate({
                  size: {
                    width: Math.max(120, startW + ev.clientX - startX),
                    height: Math.max(60, startH + ev.clientY - startY),
                  },
                });
              };
              const up = () => {
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
              };
              document.addEventListener("mousemove", move);
              document.addEventListener("mouseup", up);
            }}
          />
        </>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Wire component (svg path)                                          */
/* ------------------------------------------------------------------ */
const Wire: FC<{
  conn: Connection;
  nodesMap: Map<string, NodeItem>;
  onClick: () => void;
}> = ({ conn, nodesMap, onClick }) => {
  const fromNode = nodesMap.get(conn.fromNode);
  const toNode = nodesMap.get(conn.toNode);
  if (!fromNode || !toNode) return null;

  const fromPort = fromNode.outputs.find((p) => p.id === conn.fromPort);
  const toPort = toNode.inputs.find((p) => p.id === conn.toPort);
  if (!fromPort || !toPort) return null;

  const x1 = fromNode.position.x + fromNode.size.width;
  const y1 =
    fromNode.position.y +
    (fromNode.outputs.length > 1
      ? (fromNode.outputs.findIndex((p) => p.id === fromPort.id) + 1) *
        (fromNode.size.height / (fromNode.outputs.length + 1))
      : fromNode.size.height / 2);

  const x2 = toNode.position.x;
  const y2 =
    toNode.position.y +
    (toNode.inputs.length > 1
      ? (toNode.inputs.findIndex((p) => p.id === toPort.id) + 1) *
        (toNode.size.height / (toNode.inputs.length + 1))
      : toNode.size.height / 2);

  const dx = Math.abs(x2 - x1) * 0.4;
  const path = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;

  return (
    <g className="wire" onClick={onClick}>
      <path d={path} className="wire-path" />
      <polygon
        points={`${x2 - 6},${y2 - 4} ${x2 - 6},${y2 + 4} ${x2},${y2}`}
        className="wire-arrow"
      />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Palette (n8n style)                                                */
/* ------------------------------------------------------------------ */
const Palette: FC<{
  onAdd: (type: NodeType, pos: { x: number; y: number }) => void;
}> = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="palette-trigger"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="palette-plus">+</button>
      {open && (
        <div className="palette">
          {(["todo", "reminder", "warning", "faq"] as NodeType[]).map((t) => (
            <div
              key={t}
              className="palette-item"
              style={{ background: nodeColors[t] }}
              draggable
              onDragEnd={(e) => {
                onAdd(t, { x: e.clientX - 50, y: e.clientY - 30 });
              }}
              onClick={(e) =>
                onAdd(t, { x: e.clientX - 50, y: e.clientY - 30 })
              }
            >
              {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Block spec                                                         */
/* ------------------------------------------------------------------ */
export const nodeGraphBlock = createReactBlockSpec(
  {
    type: "node-graph",
    propSchema,
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const svgRef = useRef<SVGSVGElement>(null);

      /* ------------- state ------------- */
      const [nodes, setNodes] = useState<NodeItem[]>(() =>
        JSON.parse(block.props.nodes || "[]")
      );
      const [conns, setConns] = useState<Connection[]>(() =>
        JSON.parse(block.props.connections || "[]")
      );
      const viewport = useMemo<{
        x: number;
        y: number;
        zoom: number;
      }>(() => JSON.parse(block.props.viewport || '{"x":0,"y":0,"zoom":1}'), [
        block.props.viewport,
      ]);

      const [sel, setSel] = useState<string | null>(null);
      const [dragging, setDragging] = useState<{
        id: string;
        offsetX: number;
        offsetY: number;
      } | null>(null);

      const [wireStart, setWireStart] = useState<{
        node: string;
        port: string;
        screen: { x: number; y: number };
      } | null>(null);
      const [wireHover, setWireHover] = useState<{
        node: string;
        port: string;
      } | null>(null);

      /* ------------- derived ------------- */
      const nodesMap = useMemo(
        () => new Map(nodes.map((n) => [n.id, n])),
        [nodes]
      );

      /* ------------- sync block ------------- */
      const sync = useCallback(
        (nextNodes?: NodeItem[], nextConns?: Connection[], nextVP?) => {
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

      /* ------------- actions ------------- */
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
        const nextConns = conns.filter(
          (c) => c.fromNode !== sel && c.toNode !== sel
        );
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

      /* ------------- drag node ------------- */
      useEffect(() => {
        if (!dragging) return;
        const move = (e: MouseEvent) => {
          const dx = (e.clientX - dragging.offsetX - viewport.x) / viewport.zoom;
          const dy = (e.clientY - dragging.offsetY - viewport.y) / viewport.zoom;
          setNodes((prev) =>
            prev.map((n) =>
              n.id === dragging.id
                ? { ...n, position: { x: snap(dx), y: snap(dy) } }
                : n
            )
          );
        };
        const up = () => {
          setDragging(null);
          sync();
        };
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
        return () => {
          document.removeEventListener("mousemove", move);
          document.removeEventListener("mouseup", up);
        };
      }, [dragging, viewport, sync]);

      /* ------------- zoom / pan ------------- */
      const onWheel = useCallback(
        (e: WheelEvent) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const delta = -e.deltaY * 0.001;
          const newZoom = Math.min(Math.max(viewport.zoom + delta, 0.3), 2);
          const newX =
            viewport.x -
            (mouseX - viewport.x) * (newZoom / viewport.zoom - 1);
          const newY =
            viewport.y -
            (mouseY - viewport.y) * (newZoom / viewport.zoom - 1);
          const nextVP = { x: newX, y: newY, zoom: newZoom };
          sync(undefined, undefined, nextVP);
        },
        [viewport, sync]
      );

      /* ------------- wire dragging ------------- */
      useEffect(() => {
        if (!wireStart) return;
        const move = (e: MouseEvent) => {
          const svg = svgRef.current!;
          const pt = svg.createSVGPoint();
          pt.x = e.clientX;
          pt.y = e.clientY;
          const cursor = pt.matrixTransform(svg.getScreenCTM()?.inverse());
          const path = `M${wireStart.screen.x},${wireStart.screen.y} C${
            wireStart.screen.x + 80
          },${wireStart.screen.y} ${cursor.x - 80},${cursor.y} ${cursor.x},${cursor.y}`;
          const tmp = svg.querySelector(".wire-tmp");
          if (tmp) tmp.setAttribute("d", path);
        };
        const up = () => {
          if (wireHover) {
            const exists = conns.some(
              (c) =>
                (c.fromNode === wireStart!.node && c.toNode === wireHover.node) ||
                (c.fromNode === wireHover.node && c.toNode === wireStart!.node)
            );
            if (!exists && wireStart!.node !== wireHover.node) {
              const next: Connection = {
                id: crypto.randomUUID(),
                fromNode: wireStart!.node,
                fromPort: wireStart!.port,
                toNode: wireHover.node,
                toPort: wireHover.port,
              };
              const nextConns = [...conns, next];
              setConns(nextConns);
              sync(undefined, nextConns);
            }
          }
          svgRef.current!.querySelector(".wire-tmp")?.remove();
          setWireStart(null);
          setWireHover(null);
        };
        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
        return () => {
          document.removeEventListener("mousemove", move);
          document.removeEventListener("mouseup", up);
        };
      }, [wireStart, wireHover, conns, sync]);

      /* ------------- keyboard ------------- */
      useEffect(() => {
        const down = (e: KeyboardEvent) => {
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
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
      }, [deleteSelection, duplicateSelection]);

      /* ------------- render ------------- */
      return (
        <div
          ref={containerRef}
          className="node-graph-container"
          tabIndex={0}
          onWheel={onWheel}
          onMouseDown={(e) => {
            // pan
            if (e.button === 1 || e.button === 0) {
              const startX = e.clientX - viewport.x;
              const startY = e.clientY - viewport.y;
              const move = (ev: MouseEvent) => {
                const nextVP = {
                  x: ev.clientX - startX,
                  y: ev.clientY - startY,
                  zoom: viewport.zoom,
                };
                sync(undefined, undefined, nextVP);
              };
              const up = () => {
                document.removeEventListener("mousemove", move);
                document.removeEventListener("mouseup", up);
              };
              document.addEventListener("mousemove", move);
              document.addEventListener("mouseup", up);
            }
            setSel(null);
          }}
        >
          <Palette onAdd={addNode} />

          <svg
            ref={svgRef}
            className="node-graph-svg"
            style={{
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 6 3, 0 6" className="wire-arrow" />
              </marker>
            </defs>

            {/* wires */}
            <g className="wires">
              {conns.map((c) => (
                <Wire
                  key={c.id}
                  conn={c}
                  nodesMap={nodesMap}
                  onClick={() => {
                    setConns((prev) => prev.filter((x) => x.id !== c.id));
                    sync(undefined, conns.filter((x) => x.id !== c.id));
                  }}
                />
              ))}
              {/* temporary while dragging */}
              {wireStart && (
                <path className="wire-tmp" fill="none" markerEnd="url(#arrowhead)" />
              )}
            </g>
          </svg>

          {/* nodes layer */}
          <div
            className="nodes-layer"
            style={{
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            }}
          >
            {nodes.map((n) => (
              <NodeWidget
                key={n.id}
                node={n}
                selected={sel === n.id}
                onSelect={setSel}
                onUpdate={(patch) => {
                  const next = nodes.map((x) =>
                    x.id === n.id ? { ...x, ...patch } : x
                  );
                  setNodes(next);
                  sync(next);
                }}
                onDragStart={(id, e) => {
                  setDragging({
                    id,
                    offsetX: e.clientX - n.position.x * viewport.zoom - viewport.x,
                    offsetY: e.clientY - n.position.y * viewport.zoom - viewport.y,
                  });
                }}
                onDragNewWire={(nodeId, port) => {
                  if (port.type !== "output") return;
                  const rect = containerRef.current!.getBoundingClientRect();
                  const x =
                    (n.position.x + n.size.width) * viewport.zoom + viewport.x;
                  const y =
                    (n.position.y + n.size.height / 2) * viewport.zoom +
                    viewport.y;
                  setWireStart({ node: nodeId, port: port.id, screen: { x, y } });
                  // inject tmp path
                  const svg = svgRef.current!;
                  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
                  p.setAttribute("class", "wire-tmp");
                  p.setAttribute("fill", "none");
                  p.setAttribute("marker-end", "url(#arrowhead)");
                  svg.querySelector(".wires")!.appendChild(p);
                }}
                onEndNewWire={(nodeId, port) => {
                  if (port.type !== "input") return;
                  setWireHover({ node: nodeId, port: port.id });
                }}
                onPortHover={() => {}}
              />
            ))}
          </div>

          {/* node editor modal */}
          {sel && nodesMap.get(sel)?.type === "todo" && (
            <div className="node-modal">
              <h3>Todo list</h3>
              <ul>
                {nodesMap.get(sel)!.data.todos.map((t, i) => (
                  <li key={i}>
                    {t}{" "}
                    <button
                      onClick={() => {
                        const next = nodes.map((n) =>
                          n.id === sel
                            ? { ...n, data: { ...n.data, todos: n.data.todos.filter((_, idx) => idx !== i) } }
                            : n
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
                    const next = nodes.map((n) =>
                      n.id === sel
                        ? { ...n, data: { ...n.data, todos: [...n.data.todos, val] } }
                        : n
                    );
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