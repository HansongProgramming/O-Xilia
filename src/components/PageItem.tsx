import React from "react";
import type { Page } from "../types";

interface PageItemProps {
  page: Page;
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
  return (
    <div
      className={`page-item ${page.id === activePageId ? "active" : ""}`}
      onClick={() => setActivePageId(page.id)}
    >
      <button
        className="icon-button page-icon"
        onClick={(ev) => {
          ev.stopPropagation();
          openIconPicker(ev, "page", page.id);
        }}
      >
        <span className="icon-text">{page.icon}</span>
      </button>

      <span className="page-title">{page.title}</span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          deletePage(page.id);
        }}
        className="delete-page-btn"
      >
        ×
      </button>
    </div>
  );
}
