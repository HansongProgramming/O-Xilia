import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import "./index.css";

import Sidebar from "./components/Sidebar";
import { useEffect, useState } from "react";

import { useLoadData } from "./hooks/useLoadData";
import { useEditor } from "./hooks/useEditor";
import { useAutoSave } from "./hooks/useAutoSave";
import { useOutsideClick } from "./hooks/useOutsideClick";
import { useActions } from "./hooks/useActions";
import type { Category, Page, ContextMenuState, IconPickerState } from "./types";

export default function App() {
    const {
        categories,
        setCategories,
        activePageId,
        setActivePageId,
        isLoading,
    } = useLoadData();

    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        type: null,
        categoryId: null
    });
    const [iconPicker, setIconPicker] = useState<IconPickerState>({
        visible: false,
        x: 0,
        y: 0,
        forType: null,
        id: null
    });

    const editor = useEditor(categories, activePageId, isLoading);

    useAutoSave(categories, isLoading);

    useOutsideClick(setContextMenu, setIconPicker);

    const actions = useActions(
        categories,
        setCategories,
        activePageId,
        setActivePageId,
        setContextMenu,
        iconPicker,
        setIconPicker
    );

    if (isLoading) return <div>Loading...</div>;

    const activePage = categories
        .flatMap((c) => c.pages || [])
        .find((p) => p?.id === activePageId);

    return (
        <div className="app">
            <Sidebar
                categories={categories}
                activePageId={activePageId}
                contextMenu={contextMenu}
                iconPicker={iconPicker}
                openIconPicker={actions.openIconPicker}
                setContextMenu={setContextMenu}
                createCategory={actions.createCategory}
                createPage={actions.createPage}
                deleteCategory={actions.deleteCategory}
                updateCategoryName={actions.updateCategoryName}
                toggleCategoryExpanded={actions.toggleCategoryExpanded}
                deletePage={actions.deletePage}
                setActivePageId={setActivePageId}
                setCategoryFolder={actions.setCategoryFolder}
                onEmojiSelect={actions.onEmojiSelect}
            />

            <main className="main-content">
                ...
            </main>
        </div>
    );
}
