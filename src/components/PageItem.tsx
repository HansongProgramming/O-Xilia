import React from "react";
import type { Page } from "../types";
import { Icon } from "@iconify/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PageItemProps {
  page: Page;
  pages: Page[];
  categoryId: string;
  level: number;
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
  pages,
  level,
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

  const children = pages.filter((p) => p.parentId === page.id);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    marginLeft: level * 16,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`page-item tree-node ${
          page.id === activePageId ? "active" : ""
        }`}
        onClick={() => setActivePageId(page.id)}
      >
        <span
          className="drag-handle"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
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
            icon={page.icon ? `ic:${page.icon}` : "mdi:file"}
            width="18"
            height="18"
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

      {children.map((child) => (
        <PageItem
          key={child.id}
          page={child}
          pages={pages}
          categoryId={page.categoryId}
          level={level + 1}
          activePageId={activePageId}
          setActivePageId={setActivePageId}
          deletePage={deletePage}
          openIconPicker={openIconPicker}
        />
      ))}
    </>
  );
}
