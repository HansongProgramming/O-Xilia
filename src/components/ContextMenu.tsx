import React from "react";
import type { ContextMenuState } from "../types";
import { Icon } from '@iconify/react';

interface ContextMenusProps {
  contextMenu: ContextMenuState;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState>>;
  createCategory: () => void;
  createPage: (categoryId: string) => void;
  deleteCategory: (categoryId: string) => void;
  updateCategoryName: (categoryId: string, newName: string) => void;
  setCategoryFolder: (categoryId: string) => void | Promise<void>;
}

export default function ContextMenus({
  contextMenu,
  setContextMenu,
  createCategory,
  createPage,
  deleteCategory,
  updateCategoryName,
  setCategoryFolder,
}: ContextMenusProps) {
  if (!contextMenu.visible) return null;

  const close = () =>
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      type: null,
      categoryId: null,
    });

  const position = {
    position: "fixed" as const,
    top: contextMenu.y,
    left: contextMenu.x,
    zIndex: 9999,
  };

  if (contextMenu.type === "category")
    return (
      <div
        className="context-menu"
        style={position}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            createPage(contextMenu.categoryId!);
            close();
          }}
        >
          <Icon icon="material-symbols:new-window-rounded" width="24" height="24" color="#fff" />
          Add Page
        </button>

        <button
          onClick={() => {
            const newName = prompt("Rename category:");
            if (newName) updateCategoryName(contextMenu.categoryId!, newName);
            close();
          }}
        >
          <Icon icon="qlementine-icons:rename-16" width="24" height="24" color="#fff" />
          Rename
        </button>

        <button
          onClick={() => {
            deleteCategory(contextMenu.categoryId!);
            close();
          }}
        >
          <Icon icon="material-symbols:delete-outline-rounded" width="24" height="24" color="#fff" />

          Delete
        </button>

        <button
          onClick={() => {
            setCategoryFolder(contextMenu.categoryId!);
            close();
          }}
        >
          <Icon icon="ic:baseline-drive-folder-upload" width="24" height="24" color="#fff" />

          Choose Folder...
        </button>
      </div>
    );

  if (contextMenu.type === "sidebar")
    return (
      <div
        className="context-menu"
        style={position}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            createCategory();
            close();
          }}
        >
          <Icon icon="material-symbols:create-new-folder-outline" width="24" height="24" color="#fff" />
          New Category
        </button>
      </div>
    );

  return null;
}
