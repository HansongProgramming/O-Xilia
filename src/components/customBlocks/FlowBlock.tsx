// FlowBlock.tsx
import { createReactBlockSpec } from "@blocknote/react";
import type { PropSchema } from "@blocknote/core";
import { useState, useCallback, useEffect } from "react";
// FlowBlock.tsx
import{
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

/* ---------- prop-schema ---------- */
const propSchema = {
  flow: {
    default: JSON.stringify({ nodes: [], edges: [] }),
  },
} satisfies PropSchema;

/* ---------- helper ---------- */
type FlowData = { nodes: Node[]; edges: Edge[] };

/* ---------- block-spec ---------- */
export const flowBlock = createReactBlockSpec(
  {
    type: "flow",
    propSchema,
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      /* ---------------------------------
         local state (mirror of prop)
      ---------------------------------- */
      const [{ nodes, edges }, setFlow] = useState<FlowData>(
        JSON.parse(block.props.flow)
      );

      /* keep local state in sync if prop changes externally */
      useEffect(() => {
        setFlow(JSON.parse(block.props.flow));
      }, [block.props.flow]);

      /* ---------------------------------
         persist helper
      ---------------------------------- */
      const persist = useCallback(
        (update: Partial<FlowData>) => {
          const next = { nodes, edges, ...update };
          editor.updateBlock(block, {
            type: "flow",
            props: { flow: JSON.stringify(next) },
          });
        },
        [nodes, edges, block, editor]
      );

      /* ---------------------------------
         React-Flow callbacks
      ---------------------------------- */
      const onNodesChange: OnNodesChange = useCallback(
        (changes) => {
          const next = applyNodeChanges(changes, nodes);
          persist({ nodes: next });
        },
        [nodes, persist]
      );

      const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => {
          const next = applyEdgeChanges(changes, edges);
          persist({ edges: next });
        },
        [edges, persist]
      );

      const onConnect: OnConnect = useCallback(
        (connection) => {
          const next = addEdge(connection, edges);
          persist({ edges: next });
        },
        [edges, persist]
      );

      /* ---------------------------------
         UI
      ---------------------------------- */
      return (
        <div
          style={{
            height: 320,
            border: "1px solid #333333ff",
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