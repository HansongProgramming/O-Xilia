import React from "react";
import type { ContextMenuState } from "../types";
import { Icon } from '@iconify/react';
import type { PageType } from "../types";

interface ContextMenusProps {
  contextMenu: ContextMenuState;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState>>;
  createCategory: () => void;
  createPage: (
    categoryId: string,
    id?: string,
    title?: string,
    switchTo?: boolean,
    type?: PageType
  ) => void;
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
        <Icon icon="material-symbols:new-window-rounded" width="16" height="16" color="#fff" />
        Add Page
      </button>

      <button
        onClick={() => {
          createPage(contextMenu.categoryId!, undefined, undefined, true, "channel");
          close();
        }}
      >
        <Icon icon="material-symbols:videocam-outline" width="16" height="16" color="#fff" />
        Add Channel
      </button>

      <button
        onClick={() => {
          deleteCategory(contextMenu.categoryId!);
          close();
        }}
      >
        <Icon icon="material-symbols:delete-outline-rounded" width="16" height="16" color="#fff" />
        Delete
      </button>

      <hr color="#686E7C" />

      <button
        onClick={() => {
          setCategoryFolder(contextMenu.categoryId!);
          close();
        }}
      >
        <Icon icon="ic:baseline-drive-folder-upload" width="16" height="16" color="#fff" />
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
          <Icon icon="material-symbols:create-new-folder-outline" width="16" height="16" color="#fff" />
          New Category
        </button>
      </div>
    );

  return null;
}
