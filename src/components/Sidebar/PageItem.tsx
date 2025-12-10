import React from "react";
import type { Page } from "../../types";


type Props = {
    page: Page;
    activePageId: string;
    setActivePageId: (id: string) => void;
    deletePage: (id: string) => void;
    openIconPicker: (ev: React.MouseEvent, forType: "page" | "category", id: string) => void;
};


export function PageItem({ page, activePageId, setActivePageId, deletePage, openIconPicker }: Props) {
    return (
        <div
            className={`page-item ${page.id === activePageId ? "active" : ""}`}
            onClick={() => setActivePageId(page.id)}
        >
            <button
                className="icon-button page-icon"
                onClick={(ev) => { ev.stopPropagation(); openIconPicker(ev, "page", page.id); }}
                title="Change page icon"
            >
                <span className="icon-text">{page.icon || "📄"}</span>
            </button>


            <span className="page-title">{page.title || "Untitled"}</span>
            <button
                onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                className="delete-page-btn"
            >
                ×
            </button>
        </div>
    );
}