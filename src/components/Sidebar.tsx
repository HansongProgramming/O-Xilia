import React, { useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/core";

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
    type?: "note" | "channel",
    parentId?: string | null
  ) => void;

  createSubpage: (parentPageId: string, type?: "note" | "channel") => void;
  movePageToParent: (pageId: string, newParentId: string | null) => void;
  togglePageExpanded: (pageId: string) => void;

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
  reorderPages: (
    categoryId: string,
    pages: Category["pages"]
  ) => void;
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
  createSubpage,
  movePageToParent,
  togglePageExpanded,

  deleteCategory,
  updateCategoryName,
  toggleCategoryExpanded,

  deletePage,
  setActivePageId,

  setCategoryFolder,
  onIconSelect,

  reorderCategories,
  reorderPages,
}: SidebarProps) {
  const [dragTargetPageId, setDragTargetPageId] = useState<string | null>(null);
  const [dragStartTime, setDragStartTime] = useState<number>(0);

  function handleDragStart() {
    setDragStartTime(Date.now());
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setDragTargetPageId(null);
      return;
    }

    // Check if dragging over a page
    const allPages = categories.flatMap((c) => c.pages || []);
    const overPage = allPages.find((p) => p.id === over.id);
    const activePage = allPages.find((p) => p.id === active.id);

    if (overPage && activePage) {
      // Prevent nesting a page under its own descendant
      const isDescendant = (pageId: string, potentialAncestorId: string): boolean => {
        const page = allPages.find((p) => p.id === pageId);
        if (!page || !page.parentId) return false;
        if (page.parentId === potentialAncestorId) return true;
        return isDescendant(page.parentId, potentialAncestorId);
      };

      if (!isDescendant(overPage.id, activePage.id)) {
        setDragTargetPageId(overPage.id);
      } else {
        setDragTargetPageId(null);
      }
    } else {
      setDragTargetPageId(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const dragDuration = Date.now() - dragStartTime;
    
    setDragTargetPageId(null);
    setDragStartTime(0);

    if (!over || active.id === over.id) return;

    const allPages = categories.flatMap((c) => c.pages || []);
    const activePage = allPages.find((p) => p.id === active.id);
    const overPage = allPages.find((p) => p.id === over.id);

    // NEST PAGE: If dragging a page over another page for > 500ms
    if (activePage && overPage && dragDuration > 500) {
      // Prevent nesting under own descendant
      const isDescendant = (pageId: string, potentialAncestorId: string): boolean => {
        const page = allPages.find((p) => p.id === pageId);
        if (!page || !page.parentId) return false;
        if (page.parentId === potentialAncestorId) return true;
        return isDescendant(page.parentId, potentialAncestorId);
      };

      if (!isDescendant(overPage.id, activePage.id)) {
        movePageToParent(activePage.id, overPage.id);
        return;
      }
    }

    /** CATEGORY DRAG */
    const catFrom = categories.find((c) => c.id === active.id);
    const catTo = categories.find((c) => c.id === over.id);

    if (catFrom && catTo) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);

      reorderCategories(arrayMove(categories, oldIndex, newIndex));
      return;
    }

    /** PAGE DRAG (REORDER WITHIN SAME LEVEL) */
    for (const category of categories) {
      const pages = category.pages;
      if (!pages) continue;

      const oldIndex = pages.findIndex((p) => p.id === active.id);
      const newIndex = pages.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Only reorder if they share the same parent
        const activePage = pages[oldIndex];
        const overPage = pages[newIndex];

        if (activePage.parentId === overPage.parentId) {
          reorderPages(category.id, arrayMove(pages, oldIndex, newIndex));
          return;
        }
      }
    }
  }

  return (
    <aside
      className="sidebar"
      onContextMenu={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest(".category") ||
          target.closest(".page-item")
        )
          return;

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
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
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
                toggleCategoryExpanded={toggleCategoryExpanded}
                togglePageExpanded={togglePageExpanded}
                deletePage={deletePage}
                setActivePageId={setActivePageId}
                setContextMenu={setContextMenu}
                dragTargetPageId={dragTargetPageId}
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
        createSubpage={createSubpage}
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