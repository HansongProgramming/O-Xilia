import { createReactBlockSpec } from "@blocknote/react";
import type { PropSchema } from "@blocknote/core";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* -------------------- types -------------------- */
type NodeType = "todo" | "reminder" | "warning" | "faq";

interface Port {
  id: string;
  type: "input" | "output";
}

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

const normalizeNode = (n: Partial<NodeItem>): NodeItem => ({
  id: n.id ?? crypto.randomUUID(),
  type: n.type ?? "todo",
  position: n.position ?? { x: 0, y: 0 },
  size: n.size ?? { width: 120, height: 80 },
  data: n.data ?? { todos: [] },
  inputs: n.inputs ?? [{ id: crypto.randomUUID(), type: "input" }],
  outputs: n.outputs ?? [{ id: crypto.randomUUID(), type: "output" }],
});

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
    style={{
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: "#222",
      cursor: "crosshair",
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
}> = ({
  node,
  selected,
  onSelect,
  onUpdate,
  onDragStart,
  onDragNewWire,
  onEndNewWire,
}) => {
  if (!node?.position || !node?.size) return null;

  const color: Record<NodeType, string> = {
    todo: "#82cfff",
    reminder: "#f6d860",
    warning: "#ff6f6f",
    faq: "#c3a6ff",
  };

  return (
    <div
      style={{
        position: "absolute",
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        background: color[node.type],
        borderRadius: 6,
        cursor: "grab",
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect(node.id);
        onDragStart(node.id, e);
      }}
    >
      <div style={{ padding: 6, fontSize: 12, fontWeight: 600 }}>
        {node.type.toUpperCase()}
      </div>

      {/* inputs */}
      <div
        style={{
          position: "absolute",
          left: -8,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
        }}
      >
        {node.inputs.map((p) => (
          <PortWidget
            key={p.id}
            port={p}
            nodeId={node.id}
            onDragStart={onDragNewWire}
            onDragEnd={onEndNewWire}
          />
        ))}
      </div>

      {/* outputs */}
      <div
        style={{
          position: "absolute",
          right: -8,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
        }}
      >
        {node.outputs.map((p) => (
          <PortWidget
            key={p.id}
            port={p}
            nodeId={node.id}
            onDragStart={onDragNewWire}
            onDragEnd={onEndNewWire}
          />
        ))}
      </div>

      {selected && (
        <div
          style={{
            position: "absolute",
            bottom: -4,
            right: -4,
            width: 8,
            height: 8,
            background: "#33aaff",
            borderRadius: "50%",
            cursor: "nwse-resize",
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            const sx = e.clientX;
            const sy = e.clientY;
            const sw = node.size.width;
            const sh = node.size.height;

            const onMove = (ev: MouseEvent) =>
              onUpdate({
                size: {
                  width: Math.max(120, sw + ev.clientX - sx),
                  height: Math.max(60, sh + ev.clientY - sy),
                },
              });

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

const Wire: React.FC<{
  conn: Connection;
  nodesMap: Map<string, NodeItem>;
  onClick: () => void;
}> = ({ conn, nodesMap, onClick }) => {
  const a = nodesMap.get(conn.fromNode);
  const b = nodesMap.get(conn.toNode);
  if (!a || !b) return null;

  const x1 = a.position.x + a.size.width;
  const y1 = a.position.y + a.size.height / 2;
  const x2 = b.position.x;
  const y2 = b.position.y + b.size.height / 2;

  const dx = Math.abs(x2 - x1) * 0.4;
  const d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;

  return (
    <g onClick={onClick}>
      <path d={d} fill="none" stroke="#555" strokeWidth={2} />
    </g>
  );
};

/* -------------------- block spec -------------------- */
export const nodeGraphBlock = createReactBlockSpec(
  { type: "node-graph", propSchema, content: "none" },
  {
    render: ({ block, editor }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useState<NodeItem[]>(() =>
    JSON.parse(block.props.nodes || "[]").map(normalizeNode)
  );
  const [conns, setConns] = useState<Connection[]>(() =>
    JSON.parse(block.props.connections || "[]")
  );
  const viewport = useMemo(
    () => JSON.parse(block.props.viewport || '{"x":0,"y":0,"zoom":1}'),
    [block.props.viewport]
  );

  /* ---------- right-click menu ---------- */
  const [menu, setMenu] = useState<null | { x: number; y: number }>(null);

  const nodesMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const sync = useCallback(
    (n = nodes, c = conns, v = viewport) =>
      editor.updateBlock(block, {
        type: "node-graph",
        props: {
          nodes: JSON.stringify(n),
          connections: JSON.stringify(c),
          viewport: JSON.stringify(v),
        },
      }),
    [block, editor, nodes, conns, viewport]
  );

  /* ---------- add node at given canvas point ---------- */
  const addNodeAt = (type: NodeType, canvasX: number, canvasY: number) => {
    const id = crypto.randomUUID();
    const n: NodeItem = normalizeNode({
      id,
      type,
      position: { x: snap(canvasX - 60), y: snap(canvasY - 40) },
    });
    const next = [...nodes, n];
    setNodes(next);
    sync(next);
  };

  /* ---------- context-menu handlers ---------- */
  const onContext = (e: React.MouseEvent) => {
    e.preventDefault(); // stop browser menu
    const rect = containerRef.current!.getBoundingClientRect();
    setMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };
  const closeMenu = () => setMenu(null);

  /* ---------- click outside to close ---------- */
  useEffect(() => {
    if (!menu) return;
    const hide = () => closeMenu();
    document.addEventListener("click", hide);
    return () => document.removeEventListener("click", hide);
  }, [menu]);

  /* ---------- optional: pan & zoom ---------- */
  const onWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = -e.deltaY * 0.001;
    const newZoom = Math.min(Math.max(viewport.zoom + delta, 0.3), 2);
    const newX = viewport.x - (mouseX - viewport.x) * (newZoom / viewport.zoom - 1);
    const newY = viewport.y - (mouseY - viewport.y) * (newZoom / viewport.zoom - 1);
    sync(nodes, conns, vp(newX, newY, newZoom));
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={onContext}
      onWheel={onWheel}
      style={{
        position: "relative",
        width: "100%",
        height: 400,
        background: "#fff",
        border: "1px solid #ccc",
        overflow: "hidden",
        cursor: "crosshair",
      }}
    >
      {/* ------------- wires ------------- */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          transform: `translate(${viewport.x}px,${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        {conns.map((c) => (
          <Wire
            key={c.id}
            conn={c}
            nodesMap={nodesMap}
            onClick={() => {
              const next = conns.filter((x) => x.id !== c.id);
              setConns(next);
              sync(nodes, next);
            }}
          />
        ))}
      </svg>

      {/* ------------- nodes ------------- */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${viewport.x}px,${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        {nodes.map((n) => (
          <NodeWidget
            key={n.id}
            node={n}
            selected={false}
            onSelect={() => {}}
            onUpdate={(p) => {
              const next = nodes.map((x) =>
                x.id === n.id ? { ...x, ...p } : x
              );
              setNodes(next);
              sync(next);
            }}
            onDragStart={() => {}}
            onDragNewWire={() => {}}
            onEndNewWire={() => {}}
          />
        ))}
      </div>

      {/* ------------- right-click menu ------------- */}
      {menu && (
        <div
          style={{
            position: "absolute",
            left: menu.x,
            top: menu.y,
            background: "#fff",
            border: "1px solid #999",
            borderRadius: 4,
            padding: "4px 0",
            zIndex: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,.15)",
          }}
          onClick={(e) => e.stopPropagation()} // keep menu open on internal clicks
        >
          {(["todo", "reminder", "warning", "faq"] as NodeType[]).map((t) => (
            <div
              key={t}
              onClick={() => {
                const rect = containerRef.current!.getBoundingClientRect();
                const canvasX = (menu.x - viewport.x) / viewport.zoom;
                const canvasY = (menu.y - viewport.y) / viewport.zoom;
                addNodeAt(t, canvasX, canvasY);
                closeMenu();
              }}
              style={{
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 12,
                background: { todo: "#82cfff", reminder: "#f6d860", warning: "#ff6f6f", faq: "#c3a6ff" }[t],
              }}
            >
              {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
},
  }
);
