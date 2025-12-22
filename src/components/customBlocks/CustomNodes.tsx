import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Icon } from "@iconify/react";

type CustomNodeData = {
  pageId: string;
  title: string;
  kind: "warning" | "announcement" | "todo" | "info";
};

const nodeStyles: Record<
  "warning" | "announcement" | "todo" | "info",
  {
    background: string;
    border: string;
    icon: string;
    color: string;
  }
> = {
  warning: {
    background: "linear-gradient(135deg, #e69819 0%, #d88a15 100%)",
    border: "2px solid #cc7a10",
    icon: "ic:round-warning",
    color: "#fff",
  },
  announcement: {
    background: "linear-gradient(135deg, #507aff 0%, #3d5fcf 100%)",
    border: "2px solid #2d4faf",
    icon: "ic:round-campaign",
    color: "#fff",
  },
  todo: {
    background: "linear-gradient(135deg, #0bc10b 0%, #089a08 100%)",
    border: "2px solid #067a06",
    icon: "ic:round-check-circle",
    color: "#fff",
  },
  info: {
    background: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
    border: "2px solid #1f6aa0",
    icon: "ic:round-info",
    color: "#fff",
  },
};

const BaseNode = memo(({ data }: NodeProps) => {
  const nodeData = data as CustomNodeData;
  const style = nodeStyles[nodeData.kind];

  return (
    <>
      <Handle type="target" position={Position.Left} />

      <div
        style={{
          padding: "12px 16px",
          borderRadius: "8px",
          background: style.background,
          border: style.border,
          minWidth: "160px",
          maxWidth: "220px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: style.color,
          fontWeight: "500",
          fontSize: "14px",
        }}
      >
        <Icon icon={style.icon} width="20" height="20" />
        <div style={{ flex: 1, wordBreak: "break-word" }}>
          {nodeData.title}
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </>
  );
});

BaseNode.displayName = "BaseNode";

export const WarningNode = BaseNode;
export const AnnouncementNode = BaseNode;
export const TodoNode = BaseNode;
export const InfoNode = BaseNode;
