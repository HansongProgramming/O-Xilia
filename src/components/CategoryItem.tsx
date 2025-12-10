import React from "react";
import PageItem from "./PageItem";
import type { Category, ContextMenuState } from "../types";

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
}: CategoryItemProps) {
  return (
    <div className="category">
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

        <button
          className="icon-button category-icon"
          onClick={(ev) => openIconPicker(ev, "category", category.id)}
        >
          <span className="icon-text">{category.icon}</span>
        </button>

        <input
          type="text"
          className="category-name-input"
          value={category.name}
          onChange={(e) => updateCategoryName(category.id, e.target.value)}
        />

        <button
          className="category-toggle"
          onClick={() => toggleCategoryExpanded(category.id)}
        >
          {category.isExpanded ? "▼" : "▶"}
        </button>
      </div>

      {category.isExpanded && (
        <div className="pages-list">
          {category.pages?.map((page) => (
            <PageItem
              key={page.id}
              page={page}
              activePageId={activePageId}
              setActivePageId={setActivePageId}
              deletePage={deletePage}
              openIconPicker={openIconPicker}
            />
          ))}
        </div>
      )}
    </div>
  );
}
