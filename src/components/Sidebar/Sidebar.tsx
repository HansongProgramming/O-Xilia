import React from "react";
import { SidebarHeader } from "./SidebarHeader";
import { CategoryItem } from "./CategoryItem";
import type { Category } from "../../types";


type Props = {
    categories: Category[];
    activePageId: string;
    setActivePageId: (id: string) => void;
    createCategory: () => void;
    toggleCategoryExpanded: (id: string) => void;
    updateCategoryName: (id: string, name: string) => void;
    deletePage: (id: string) => void;
    openIconPicker: (ev: React.MouseEvent, forType: "page" | "category", id: string) => void;
};


export function Sidebar({ categories, activePageId, setActivePageId, createCategory, toggleCategoryExpanded, updateCategoryName, deletePage, openIconPicker }: Props) {
    return (
        <aside
            className="sidebar"
            onContextMenu={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest(".category") || target.closest(".category-header") || target.closest(".page-item")) {
                    return;
                }
                e.preventDefault();
                const event = new CustomEvent("oxilia:sidebar-context", { detail: { x: e.clientX, y: e.clientY } });
                window.dispatchEvent(event);
            }}
        >
            <SidebarHeader />


            <div className="categories-list">
                {categories.map((category) => (
                    <CategoryItem
                        key={category.id}
                        category={category}
                        activePageId={activePageId}
                        setActivePageId={setActivePageId}
                        toggleCategoryExpanded={toggleCategoryExpanded}
                        updateCategoryName={updateCategoryName}
                        deletePage={deletePage}
                        openIconPicker={openIconPicker}
                    />
                ))}
            </div>


            <div style={{ padding: 12 }}>
                <button onClick={createCategory}>➕ New Category</button>
            </div>
        </aside>
    );
}