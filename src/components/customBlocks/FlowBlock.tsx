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

/* ------------------------------------------------------------------ */
/* Block Spec                                                         */
/* ------------------------------------------------------------------ */
export const flowBlock = createReactBlockSpec(
  {
    type: "flow", // ⚠️ must be unique in BlockNote
    propSchema,
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      /* -------------------- init state safely -------------------- */
      const [flow, setFlow] = useState<FlowData>(() => {
        try {
          return JSON.parse(block.props.flow);
        } catch {
          return { nodes: [], edges: [] };
        }
      });

      const { nodes, edges } = flow;

      /* -------------------- sync external updates -------------------- */
      useEffect(() => {
        try {
          setFlow(JSON.parse(block.props.flow));
        } catch {
          /* ignore corrupted data */
        }
      }, [block.props.flow]);

      /* -------------------- persist helper -------------------- */
      const persist = useCallback(
        (next: FlowData) => {
          editor.updateBlock(block, {
            type: "flow",
            props: {
              flow: JSON.stringify(next),
            },
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
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>
        </div>
      );
    },
  }
);
