import React from "react";
import CategoryItem from "./CategoryItem";
import ContextMenus from "./ContextMenu";
import IconPickerMenu from "./IconPickerMenu";
import { Icon } from '@iconify/react';

import type {
  Category,
  ContextMenuState,
  IconPickerState,
} from "../types";

interface SidebarProps {
  categories: Category[];
  activePageId: string;
  contextMenu: ContextMenuState;
  iconPicker: IconPickerState;
  openIconPicker: (
    ev: React.MouseEvent,
    forType: "category" | "page",
    id: string
  ) => void;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState>>;
  createCategory: (opts?: { name?: string; focus?: boolean }) => void;
  createPage: (categoryId: string) => void;
  deleteCategory: (catId: string) => void;
  updateCategoryName: (categoryId: string, name: string) => void;
  toggleCategoryExpanded: (categoryId: string) => void;
  deletePage: (pageId: string) => void;
  setActivePageId: (id: string) => void;
  setCategoryFolder: (categoryId?: string) => Promise<void>;
  onIconSelect: (iconName: string) => void; // updated from onEmojiSelect
}

export default function Sidebar({
  categories,
  activePageId,
  contextMenu,
  iconPicker,
  openIconPicker,
  setContextMenu,
  createCategory,
  createPage,
  deleteCategory,
  updateCategoryName,
  toggleCategoryExpanded,
  deletePage,
  setActivePageId,
  setCategoryFolder,
  onIconSelect, // updated
}: SidebarProps) {
  return (
    <aside
      className="sidebar"
      onContextMenu={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest(".category") || target.closest(".page-item")) return;

        e.preventDefault();
        setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          type: "sidebar",
          categoryId: null,
        });
      }}
    >
      <div className="sidebar-header">
        <img src="./assets/OxiliaLogo.svg" alt="" className="Logo" />
        O-Xilia
      </div>

      <div className="categories-list">
        {categories.map((category) => (
          <CategoryItem
            key={category.id}
            category={category}
            activePageId={activePageId}
            openIconPicker={openIconPicker}
            updateCategoryName={updateCategoryName}
            toggleCategoryExpanded={toggleCategoryExpanded}
            deletePage={deletePage}
            setActivePageId={setActivePageId}
            setContextMenu={setContextMenu}
          />
        ))}
      </div>

      <ContextMenus
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        createCategory={createCategory}
        createPage={createPage}
        deleteCategory={deleteCategory}
        updateCategoryName={updateCategoryName}
        setCategoryFolder={setCategoryFolder}
      />

      {/* updated prop from onEmojiSelect to onIconSelect */}
      <IconPickerMenu iconPicker={iconPicker} onIconSelect={onIconSelect} />
    </aside>
  );
}
