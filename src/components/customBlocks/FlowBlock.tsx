// FlowBlock.tsx
import { createReactBlockSpec } from "@blocknote/react";
import type { PropSchema } from "@blocknote/core";
import { useState, useCallback, useEffect } from "react";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type XYPosition,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

/* ------------------------------------------------------------------ */
/* Prop Schema                                                         */
/* ------------------------------------------------------------------ */
const propSchema = {
  flow: {
    default: JSON.stringify({
      nodes: [],
      edges: [],
    }),
  },
} satisfies PropSchema;

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type FlowData = {
  nodes: Node[];
  edges: Edge[];
};

type MenuState = {
  visible: boolean;
  position: XYPosition;
};

/* ------------------------------------------------------------------ */
/* Block Spec                                                         */
/* ------------------------------------------------------------------ */
export const flowBlock = createReactBlockSpec(
  {
    type: "flow",
    propSchema,
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      /* -------------------- state -------------------- */
      const [flow, setFlow] = useState<FlowData>(() => {
        try {
          return JSON.parse(block.props.flow);
        } catch {
          return { nodes: [], edges: [] };
        }
      });

      const [menu, setMenu] = useState<MenuState>({
        visible: false,
        position: { x: 0, y: 0 },
      });

      const { nodes, edges } = flow;

      /* -------------------- sync external updates -------------------- */
      useEffect(() => {
        try {
          setFlow(JSON.parse(block.props.flow));
        } catch { }
      }, [block.props.flow]);

      /* -------------------- persist helper -------------------- */
      const persist = useCallback(
        (next: FlowData) => {
          editor.updateBlock(block, {
            type: "flow",
            props: { flow: JSON.stringify(next) },
          });
        },
        [block, editor]
      );

      /* -------------------- React Flow callbacks -------------------- */
      const onNodesChange: OnNodesChange = useCallback(
        (changes) => {
          setFlow((prev) => {
            const next = {
              ...prev,
              nodes: applyNodeChanges(changes, prev.nodes),
            };
            persist(next);
            return next;
          });
        },
        [persist]
      );

      const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => {
          setFlow((prev) => {
            const next = {
              ...prev,
              edges: applyEdgeChanges(changes, prev.edges),
            };
            persist(next);
            return next;
          });
        },
        [persist]
      );

      const onConnect: OnConnect = useCallback(
        (connection) => {
          setFlow((prev) => {
            const next = {
              ...prev,
              edges: addEdge(connection, prev.edges),
            };
            persist(next);
            return next;
          });
        },
        [persist]
      );

      /* -------------------- right click -------------------- */
      const onContextMenu = useCallback(
        (event: React.MouseEvent) => {
          event.preventDefault();

          const bounds = (
            event.currentTarget as HTMLDivElement
          ).getBoundingClientRect();

          setMenu({
            visible: true,
            position: {
              x: event.clientX - bounds.left,
              y: event.clientY - bounds.top,
            },
          });
        },
        []
      );

      /* -------------------- add node -------------------- */
      const addNode = useCallback(
        (kind: string) => {
          const pageId = crypto.randomUUID();

          // 🔹 fire event so App can create a page
          window.dispatchEvent(
            new CustomEvent("flow:create-page", {
              detail: {
                pageId,
                title: kind.toUpperCase(),
                kind,
              },
            })
          );

          setFlow((prev) => {
            const newNode: Node = {
              id: `node-${pageId}`,
              position: menu.position,
              data: {
                pageId,
                title: kind.toUpperCase(),
                kind,
              },
            };

            const next = {
              ...prev,
              nodes: [...prev.nodes, newNode],
            };

            persist(next);
            return next;
          });

          setMenu((m) => ({ ...m, visible: false }));
        },
        [menu.position, persist]
      );


      /* -------------------- UI -------------------- */
      return (
        <div
          style={{
            height: 320,
            width: "100%",
            minWidth: 300,
            position: "relative",
            border: "1px solid #333",
            borderRadius: 4,
          }}
          onContextMenu={onContextMenu}
          onClick={() => setMenu((m) => ({ ...m, visible: false }))}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={(_, node) => {
              window.dispatchEvent(
                new CustomEvent("flow:open-page", {
                  detail: { pageId: node.data.pageId },
                })
              );
            }}
            fitView
          >

            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>

          {/* -------- context menu -------- */}
          {menu.visible && (
            <div
              style={{
                position: "absolute",
                top: menu.position.y,
                left: menu.position.x,
                background: "#1e1e1e",
                border: "1px solid #444",
                borderRadius: 6,
                padding: 6,
                zIndex: 10,
                minWidth: 160,
              }}
            >
              {[
                ["warning", "⚠ Warning"],
                ["announcement", "📢 Announcement"],
                ["todo", "✅ Todo"],
                ["info", "ℹ Info"],
              ].map(([kind, label]) => (
                <div
                  key={kind}
                  onClick={() => addNode(kind)}
                  style={{
                    padding: "6px 8px",
                    cursor: "pointer",
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#333")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {label}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    },
  }
);
