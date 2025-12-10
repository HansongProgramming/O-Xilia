import React from "react";
import { PageItem } from "./PageItem";
import type { Category } from "../../types";


type Props = {
    category: Category;
    activePageId: string;
    setActivePageId: (id: string) => void;
    toggleCategoryExpanded: (id: string) => void;
    updateCategoryName: (id: string, name: string) => void;
    deletePage: (id: string) => void;
    openIconPicker: (ev: React.MouseEvent, forType: "page" | "category", id: string) => void;
};

export function CategoryItem({ category, activePageId, setActivePageId, toggleCategoryExpanded, updateCategoryName, deletePage, openIconPicker }: Props) {
    return (
        <div className="category">
            <div
                className="category-header"
                onContextMenu={(e) => {
                    e.preventDefault();
                    // Parent Sidebar will open the context menu with proper coords and id
                    const event = new CustomEvent("oxilia:category-context", { detail: { x: e.clientX, y: e.clientY, id: category.id } });
                    window.dispatchEvent(event);
                }}
            >
                <button
                    className="icon-button category-icon"
                    onClick={(ev) => openIconPicker(ev, "category", category.id)}
                    title="Change category icon"
                >
                    <span className="icon-text">{category.icon || "📁"}</span>
                </button>


                <input
                    type="text"
                    value={category.name}
                    onChange={(e) => updateCategoryName(category.id, e.target.value)}
                    className="category-name-input"
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