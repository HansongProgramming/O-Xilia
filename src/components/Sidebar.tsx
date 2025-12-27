import React from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import CategoryItem from "./CategoryItem";
import ContextMenus from "./ContextMenu";
import IconPickerMenu from "./IconPickerMenu";

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

  setContextMenu: React.Dispatch<
    React.SetStateAction<ContextMenuState>
  >;

  createCategory: (opts?: {
    name?: string;
    focus?: boolean;
  }) => void;

  createPage: (
    categoryId: string,
    id?: string,
    title?: string,
    switchTo?: boolean,
    type?: "note" | "channel"
  ) => void;

  deleteCategory: (catId: string) => void;
  updateCategoryName: (
    categoryId: string,
    name: string
  ) => void;
  toggleCategoryExpanded: (categoryId: string) => void;

  deletePage: (pageId: string) => void;
  setActivePageId: (id: string) => void;

  setCategoryFolder: (categoryId?: string) => Promise<void>;
  onIconSelect: (iconName: string) => void;

  reorderCategories: (categories: Category[]) => void;
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
  onIconSelect,

  reorderCategories,
}: SidebarProps) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = categories.findIndex(
      (c) => c.id === active.id
    );
    const newIndex = categories.findIndex(
      (c) => c.id === over.id
    );

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(
      categories,
      oldIndex,
      newIndex
    );

    reorderCategories(reordered);
  }

  return (
    <aside
      className="sidebar"
      onContextMenu={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest(".category") ||
          target.closest(".page-item")
        ) {
          return;
        }

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
        <img
          src="./assets/OxiliaLogo.svg"
          alt=""
          className="Logo"
        />
        O-Xilia
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="categories-list">
            {categories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                activePageId={activePageId}
                openIconPicker={openIconPicker}
                updateCategoryName={updateCategoryName}
                toggleCategoryExpanded={
                  toggleCategoryExpanded
                }
                deletePage={deletePage}
                setActivePageId={setActivePageId}
                setContextMenu={setContextMenu}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ContextMenus
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        createCategory={createCategory}
        createPage={createPage}
        deleteCategory={deleteCategory}
        updateCategoryName={updateCategoryName}
        setCategoryFolder={setCategoryFolder}
      />

      <IconPickerMenu
        iconPicker={iconPicker}
        onIconSelect={onIconSelect}
      />
    </aside>
  );
}
