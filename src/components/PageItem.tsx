import React from "react";
import type { Page } from "../types";
import { Icon } from "@iconify/react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PageItemProps {
  page: Page;
  categoryId: string;
  activePageId: string;
  setActivePageId: (id: string) => void;
  deletePage: (pageId: string) => void;
  openIconPicker: (
    ev: React.MouseEvent,
    forType: "category" | "page",
    id: string
  ) => void;
}

export default function PageItem({
  page,
  activePageId,
  setActivePageId,
  deletePage,
  openIconPicker,
}: PageItemProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`page-item ${page.id === activePageId ? "active" : ""}`}
      onClick={() => setActivePageId(page.id)}
    >
      <span
        className="drag-handle"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        title="Drag page"
      >
        ⋮⋮
      </span>

      <button
        className="icon-button page-icon"
        onClick={(ev) => {
          ev.stopPropagation();
          openIconPicker(ev, "page", page.id);
        }}
      >
        <Icon
          icon={page.icon ? `ic:${page.icon}` : "mdi:folder"}
          width="20"
          height="20"
        />
      </button>

      <span className="page-title">{page.title}</span>

      <button
        className="delete-page-btn"
        onClick={(e) => {
          e.stopPropagation();
          deletePage(page.id);
        }}
      >
        ×
      </button>
    </div>
  );
}
