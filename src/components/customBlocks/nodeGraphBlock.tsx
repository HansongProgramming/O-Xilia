// NodeGraphBlock.tsx
import { createReactBlockSpec } from "@blocknote/react";
import type { PropSchema } from "@blocknote/core";
import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";

import { GraphNode } from "./GraphNode";

/* ---------------- schema ---------------- */
const propSchema = {
  nodes: { default: "[]" },
  edges: { default: "[]" },
} satisfies PropSchema;

/* ---------------- node types ---------------- */
const nodeTypes = {
  graphNode: GraphNode,
};

/* ---------------- block ---------------- */
export const nodeGraphBlock = createReactBlockSpec(
  { type: "node-graph", propSchema, content: "none" },
  {
    render: ({ block, editor }) => {
      const initialNodes = useMemo<Node[]>(
        () => JSON.parse(block.props.nodes || "[]"),
        [block.props.nodes]
      );

      const initialEdges = useMemo<Edge[]>(
        () => JSON.parse(block.props.edges || "[]"),
        [block.props.edges]
      );

      const [nodes, setNodes, onNodesChange] =
        useNodesState(initialNodes);
      const [edges, setEdges, onEdgesChange] =
        useEdgesState(initialEdges);

      /* sync to BlockNote */
      const sync = useCallback(
        (n: Node[], e: Edge[]) => {
          editor.updateBlock(block, {
            type: "node-graph",
            props: {
              nodes: JSON.stringify(n),
              edges: JSON.stringify(e),
            },
          });
        },
        [editor, block]
      );

      return (
        <div style={{ height: 400, border: "1px solid #ccc" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={(c) => {
              onNodesChange(c);
              sync(nodes, edges);
            }}
            onEdgesChange={(c) => {
              onEdgesChange(c);
              sync(nodes, edges);
            }}
            onConnect={(c) => {
              const next = addEdge(c, edges);
              setEdges(next);
              sync(nodes, next);
            }}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      );
    },
  }
);
