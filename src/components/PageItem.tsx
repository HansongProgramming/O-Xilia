import React, { useState } from "react";
import type { Page, ContextMenuState } from "../types";
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
  togglePageExpanded: (pageId: string) => void;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState>>;
  onDragOver?: (pageId: string) => void;
  onDragLeave?: () => void;
  isDragTarget?: boolean;
}

export default function PageItem({
  page,
  pages,
  level,
  activePageId,
  setActivePageId,
  deletePage,
  openIconPicker,
  togglePageExpanded,
  setContextMenu,
  onDragOver,
  onDragLeave,
  isDragTarget,
}: PageItemProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const [isHovering, setIsHovering] = useState(false);

  const children = pages.filter((p) => p.parentId === page.id);
  const hasChildren = children.length > 0;
  const isExpanded = page.isExpanded ?? true;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    marginLeft: level * 16,
  };

  return (
    <div className="tree-node">
      <div
        ref={setNodeRef}
        style={style}
        className={`page-item ${
          page.id === activePageId ? "active" : ""
        } ${isDragTarget ? "drag-target" : ""}`}
        onClick={() => setActivePageId(page.id)}
        onMouseEnter={() => {
          setIsHovering(true);
          if (onDragOver) onDragOver(page.id);
        }}
        onMouseLeave={() => {
          setIsHovering(false);
          if (onDragLeave) onDragLeave();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            type: "page",
            categoryId: page.categoryId,
            pageId: page.id,
          });
        }}
      >
        <span
          className="drag-handle"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          ⋮⋮
        </span>

        {/* Expand/collapse button for pages with children */}
        {hasChildren ? (
          <button
            className="page-toggle"
            onClick={(e) => {
              e.stopPropagation();
              togglePageExpanded(page.id);
            }}
          >
            {isExpanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="page-toggle-spacer" />
        )}

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
          style={{ opacity: isHovering ? 1 : 0 }}
        >
          ×
        </button>
      </div>

      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <div className="page-children">
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
              togglePageExpanded={togglePageExpanded}
              setContextMenu={setContextMenu}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              isDragTarget={isDragTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
}