import type { XYPosition, Node } from "@xyflow/react";

// Define all node types in one place
export const NODE_TYPES = {
  warning: { label: "⚠ Warning", icon: "⚠" },
  announcement: { label: "📢 Announcement", icon: "📢" },
  todo: { label: "✅ Todo", icon: "✅" },
  info: { label: "ℹ Info", icon: "ℹ" },
} as const;

export type NodeKind = keyof typeof NODE_TYPES;

// Node creation helper
export const createNode = (kind: NodeKind, position: XYPosition): Node => {
  const pageId = crypto.randomUUID();
  const { label } = NODE_TYPES[kind];

  window.dispatchEvent(
    new CustomEvent("flow:create-page", { detail: { pageId, title: label, kind } })
  );

  return {
    id: `node-${pageId}`,
    position,
    data: { pageId, title: label, kind },
  };
};

// Node removal helper
export const removeNodeAndPage = (flow: { nodes: Node[]; edges: any[] }, nodeId: string) => {
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
