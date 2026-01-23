import React from "react";
import PageItem from "./PageItem";
import type { Category, ContextMenuState } from "../types";
import { Icon } from "@iconify/react";

import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CategoryItemProps {
  category: Category;
  activePageId: string;
  openIconPicker: (
    ev: React.MouseEvent,
    forType: "category" | "page",
    id: string
  ) => void;
  updateCategoryName: (categoryId: string, newName: string) => void;
  toggleCategoryExpanded: (categoryId: string) => void;
  deletePage: (pageId: string) => void;
  setActivePageId: (pageId: string) => void;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState>>;
  togglePageExpanded: (pageId: string) => void;
  onPageDragOver?: (pageId: string) => void;
  onPageDragLeave?: () => void;
  dragTargetPageId?: string | null;
}

export default function CategoryItem({
  category,
  activePageId,
  openIconPicker,
  updateCategoryName,
  toggleCategoryExpanded,
  deletePage,
  setActivePageId,
  setContextMenu,
  togglePageExpanded,
  onPageDragOver,
  onPageDragLeave,
  dragTargetPageId,
}: CategoryItemProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`category ${category.isExpanded ? "expanded" : ""}`}
    >
      <div
        className="category-header"
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            type: "category",
            categoryId: category.id,
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

        <button
          className="icon-button category-icon"
          onClick={(ev) => {
            ev.stopPropagation();
            openIconPicker(ev, "category", category.id);
          }}
        >
          <Icon
            icon={category.icon ? `ic:${category.icon}` : "mdi:folder"}
            width="20"
            height="20"
          />
        </button>

        <input
          className="category-name-input"
          value={category.name}
          onChange={(e) =>
            updateCategoryName(category.id, e.target.value)
          }
          onClick={(e) => e.stopPropagation()}
        />

        <button
          className="category-toggle"
          onClick={(e) => {
            e.stopPropagation();
            toggleCategoryExpanded(category.id);
          }}
        >
          {category.isExpanded ? "▾" : "▸"}
        </button>
      </div>

      {category.isExpanded && (
        <SortableContext
          items={category.pages.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="pages-list">
            {category.pages
              .filter((p) => p.parentId == null)
              .map((page) => (
                <PageItem
                  key={page.id}
                  page={page}
                  categoryId={category.id}
                  level={0}
                  pages={category.pages}
                  activePageId={activePageId}
                  setActivePageId={setActivePageId}
                  deletePage={deletePage}
                  openIconPicker={openIconPicker}
                  togglePageExpanded={togglePageExpanded}
                  setContextMenu={setContextMenu}
                  onDragOver={onPageDragOver}
                  onDragLeave={onPageDragLeave}
                  isDragTarget={dragTargetPageId === page.id}
                />
              ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}