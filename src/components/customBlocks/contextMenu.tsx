import React from "react";
import { NODE_TYPES, type NodeKind } from "./nodes";
import type { XYPosition } from "@xyflow/react";

export type MenuState = {
  visible: boolean;
  position: XYPosition;
  nodeId?: string;
};

export const FlowContextMenu = ({
  menu,
  addNode,
  deleteNode,
}: {
  menu: MenuState;
  addNode: (kind: NodeKind) => void;
  deleteNode: () => void;
}) => {
  if (!menu.visible) return null;

  return (
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
      {menu.nodeId ? (
        <div
          onClick={deleteNode}
          style={{
            padding: "6px 8px",
            cursor: "pointer",
            color: "#ff6b6b",
            borderRadius: 4,
          }}
        >
          🗑 Delete node & page
        </div>
      ) : (
        Object.entries(NODE_TYPES).map(([kind, { label }]) => (
          <div
            key={kind}
            onClick={() => addNode(kind as NodeKind)}
            style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4 }}
          >
            {label}
          </div>
        ))
      )}
    </div>
  );
};
