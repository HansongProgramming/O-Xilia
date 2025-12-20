import type { Node, Edge, XYPosition } from "@xyflow/react";

// ---------------- Node Types ----------------
export const NODE_TYPES = {
  warning: { label: "Warning"},
  announcement: { label: "Announcement"},
  todo: { label: "Todo"},
  info: { label: "Info"},
} as const;

export type NodeKind = keyof typeof NODE_TYPES;

// ---------------- Flow Data Type ----------------
export type FlowData = {
  nodes: Node[];
  edges: Edge[];
};

// ---------------- Node Helpers ----------------
export const createNode = (kind: NodeKind, position: XYPosition): Node => {
  const pageId = crypto.randomUUID();
  const { label } = NODE_TYPES[kind];

  return {
    id: `node-${pageId}`,
    type: kind,
    position,
    data: { pageId, title: label, kind },
  };
};

export const removeNodeAndPage = (flow: FlowData, nodeId: string): FlowData => {
  const node = flow.nodes.find((n) => n.id === nodeId);
  if (node?.data?.pageId) {
    window.dispatchEvent(
      new CustomEvent("flow:delete-page", { detail: { pageId: node.data.pageId } })
    );
  }

  return {
    nodes: flow.nodes.filter((n) => n.id !== nodeId),
    edges: flow.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
  };
};
