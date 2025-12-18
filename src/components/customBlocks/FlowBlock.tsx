import { createReactBlockSpec } from "@blocknote/react";
import type { PropSchema } from "@blocknote/core";
import { useState, useCallback, useRef, useEffect } from "react";
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

import type { FlowData, NodeKind } from "./nodes";
import type { MenuState } from "./contextMenu";

import { createNode, removeNodeAndPage } from "./nodes";
import { FlowContextMenu } from "./contextMenu";

// ---------------- Prop Schema ----------------
const propSchema: PropSchema = {
  flow: { default: JSON.stringify({ nodes: [], edges: [] }) },
};

export const flowBlock = createReactBlockSpec(
  { type: "flow", propSchema, content: "none" },
  {
    render: ({ block, editor }) => {
      const wrapperRef = useRef<HTMLDivElement>(null);

      const [flow, setFlow] = useState<FlowData>(() => {
        try {
          return JSON.parse(block.props.flow || "{}");
        } catch {
          return { nodes: [], edges: [] };
        }
      });

      const [menu, setMenu] = useState<MenuState>({
        visible: false,
        position: { x: 0, y: 0 },
      });

      // ---------------- Persist helper ----------------
      const persist = useCallback((nextFlow: FlowData) => {
        editor.updateBlock(block, {
          type: "flow",
          props: { flow: JSON.stringify(nextFlow) } as unknown as typeof block.props,
        });
      }, [block, editor]);

      // ---------------- Sync external updates ----------------
      useEffect(() => {
        try {
          setFlow(JSON.parse(block.props.flow || "{}"));
        } catch {}
      }, [block.props.flow]);

      // ---------------- React Flow Callbacks ----------------
      const onNodesChange: OnNodesChange = useCallback(
        (changes) => {
          setFlow((prevFlow) => {
            const nextFlow: FlowData = {
              ...prevFlow,
              nodes: applyNodeChanges(changes, prevFlow.nodes),
            };
            persist(nextFlow);
            return nextFlow;
          });
        },
        [persist]
      );

      const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => {
          setFlow((prevFlow) => {
            const nextFlow: FlowData = {
              ...prevFlow,
              edges: applyEdgeChanges(changes, prevFlow.edges),
            };
            persist(nextFlow);
            return nextFlow;
          });
        },
        [persist]
      );

      const onConnect: OnConnect = useCallback(
        (connection) => {
          setFlow((prevFlow) => {
            const nextFlow: FlowData = {
              ...prevFlow,
              edges: addEdge(connection, prevFlow.edges),
            };
            persist(nextFlow);
            return nextFlow;
          });
        },
        [persist]
      );

      // ---------------- Context Menu ----------------
      const onPaneContextMenu = useCallback(
        (event: MouseEvent | React.MouseEvent) => {
          event.preventDefault();
          if (!wrapperRef.current) return;
          const bounds = wrapperRef.current.getBoundingClientRect();
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

      const onNodeContextMenu = useCallback(
        (event: MouseEvent | React.MouseEvent, node: Node) => {
          event.preventDefault();
          if (!wrapperRef.current) return;
          const bounds = wrapperRef.current.getBoundingClientRect();
          setMenu({
            visible: true,
            nodeId: node.id,
            position: {
              x: event.clientX - bounds.left,
              y: event.clientY - bounds.top,
            },
          });
        },
        []
      );

      const addNodeHandler = useCallback(
        (kind: NodeKind) => {
          setFlow((prevFlow) => {
            const nextFlow: FlowData = {
              ...prevFlow,
              nodes: [...prevFlow.nodes, createNode(kind, menu.position)],
            };
            persist(nextFlow);
            return nextFlow;
          });
          setMenu({ visible: false, position: { x: 0, y: 0 } });
        },
        [menu.position, persist]
      );

      const deleteNodeHandler = useCallback(() => {
        if (!menu.nodeId) return;
        setFlow((prevFlow) => {
          const nextFlow = removeNodeAndPage(prevFlow, menu.nodeId!);
          persist(nextFlow);
          return nextFlow;
        });
        setMenu({ visible: false, position: { x: 0, y: 0 } });
      }, [menu.nodeId, persist]);

      // ---------------- Render ----------------
      return (
        <div
          ref={wrapperRef}
          style={{
            height: 320,
            width: "100%",
            minWidth: 300,
            position: "relative",
            border: "1px solid #333",
            borderRadius: 4,
          }}
          onClick={() => setMenu({ visible: false, position: { x: 0, y: 0 } })}
        >
          <ReactFlow
            nodes={flow.nodes}
            edges={flow.edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneContextMenu={onPaneContextMenu}
            onNodeContextMenu={onNodeContextMenu}
            onNodeDoubleClick={(_, node: Node) =>
              window.dispatchEvent(
                new CustomEvent("flow:open-page", {
                  detail: { pageId: node.data.pageId },
                })
              )
            }
            fitView
          >
            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>

          <FlowContextMenu
            menu={menu}
            addNode={addNodeHandler}
            deleteNode={deleteNodeHandler}
          />
        </div>
      );
    },
  }
);
