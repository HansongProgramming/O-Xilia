import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { BlockNoteEditor } from "@blocknote/core";
import { loadDB, saveDB, chooseFolder } from "./lib/storage";
import type { Category, Page } from "./types";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import "./index.css";

import { Sidebar } from "./components/Sidebar/Sidebar";
import { EditorView } from "./components/Editor/EditorView";
import { IconPicker } from "./components/IconPicker/IconPicker";
import { ContextMenu } from "./components/ContextMenu/ContextMenu";

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activePageId, setActivePageId] = useState<string>("");
  const editorRef = useRef<BlockNoteEditor | null>(null);
  const lastLoadedBlocksRef = useRef<any[] | null>(null);
  const isMountedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; type: "category" | "sidebar" | null; categoryId: string | null }>({ visible: false, x: 0, y: 0, type: null, categoryId: null });
  const [iconPicker, setIconPicker] = useState<{ visible: boolean; x: number; y: number; forType: "category" | "page" | null; id: string | null }>({ visible: false, x: 0, y: 0, forType: null, id: null });

  const saveTimerRef = useRef<number | null>(null);
  const editorChangeTimerRef = useRef<number | null>(null);

  // Load DB
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const dataDB = await loadDB();
        if (cancelled) return;

        if (dataDB && dataDB.length > 0) {
          setCategories(dataDB);
          const firstCategoryWithPages = dataDB.find((cat) => (cat.pages || []).length > 0);
          if (firstCategoryWithPages) setActivePageId((prev) => prev || firstCategoryWithPages.pages![0].id);
        } else {
          const defaultPage: Page = {
            id: uuid(),
            title: "Welcome to O-Xilia",
            blocks: [{ type: "paragraph", content: "Start your first note..." }],
            categoryId: "default-category",
            icon: "📄",
          };
          const defaultCategory: Category = { id: "default-category", name: "Default", icon: "📁", isExpanded: true, pages: [defaultPage] };
          setCategories([defaultCategory]);
          setActivePageId(defaultPage.id);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        const fallbackPage: Page = { id: uuid(), title: "Untitled", blocks: [{ type: "paragraph", content: "" }], categoryId: "fallback-category", icon: "📄" };
        const fallbackCategory: Category = { id: "fallback-category", name: "Default", icon: "📁", isExpanded: true, pages: [fallbackPage] };
        setCategories([fallbackCategory]);
        setActivePageId(fallbackPage.id);
      } finally {
        setIsLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const allPages = useMemo(() => categories.flatMap((cat) => cat.pages || []), [categories]);
  const activePage = useMemo(() => allPages.find((p) => p && p.id === activePageId), [allPages, activePageId]);

  useEffect(() => {
    if (isLoading) return;
    if (!editorRef.current) {
      editorRef.current = BlockNoteEditor.create({ initialContent: activePage?.blocks || [] });

      editorRef.current.onChange(() => {
        if (editorChangeTimerRef.current) window.clearTimeout(editorChangeTimerRef.current);
        editorChangeTimerRef.current = window.setTimeout(() => {
          try {
            const blocks = editorRef.current?.document || [];
            if (!activePage) return;
            setPageBlocks(activePage.id, blocks);
          } catch (err) {
            console.warn("Error syncing editor -> state:", err);
          }
        }, 500);
      });
    }

    if (activePage && editorRef.current) {
      const currentDoc = editorRef.current.document || [];
      const incoming = activePage.blocks || [];
      const needsReplace = currentDoc.length !== incoming.length || JSON.stringify(lastLoadedBlocksRef.current) !== JSON.stringify(incoming);
      if (needsReplace) {
        try {
          lastLoadedBlocksRef.current = incoming;
          try {
            editorRef.current.replaceBlocks(editorRef.current.document, incoming);
          } catch (err) {
            console.warn("replaceBlocks failed, recreating editor:", err);
            editorRef.current = BlockNoteEditor.create({ initialContent: incoming });
          }
        } catch (err) {
          console.warn("Failed to load page into editor:", err);
        }
      }
    }
  }, [isLoading, activePageId]);

  const setPageBlocks = useCallback((pageId: string, blocks: any[]) => {
    setCategories((prev) => {
      const catIndex = prev.findIndex((c) => (c.pages || []).some((p) => p.id === pageId));
      if (catIndex === -1) return prev;

      const pageIndex = (prev[catIndex].pages || []).findIndex((p) => p.id === pageId);
      if (pageIndex === -1) return prev;

      const existing = prev[catIndex].pages![pageIndex].blocks || [];
      if (JSON.stringify(existing) === JSON.stringify(blocks)) return prev;

      const newCats = prev.slice();
      const catCopy = { ...newCats[catIndex] };
      const pagesCopy = catCopy.pages ? catCopy.pages.slice() : [];
      pagesCopy[pageIndex] = { ...pagesCopy[pageIndex], blocks };
      catCopy.pages = pagesCopy;
      newCats[catIndex] = catCopy;
      return newCats;
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => { try { saveDB(categories); } catch (err) { console.error("Failed to save DB:", err); } }, 800);
    return () => { if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current); };
  }, [categories, isLoading]);

  useEffect(() => {
    if (!iconPicker.visible && !contextMenu.visible) return;
    const closeAll = () => { setContextMenu({ visible: false, x: 0, y: 0, type: null, categoryId: null }); setIconPicker({ visible: false, x: 0, y: 0, forType: null, id: null }); };
    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, [iconPicker.visible, contextMenu.visible]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ACTIONS (mirrors your original App)
  const createPage = useCallback((categoryId: string) => {
    const newPage: Page = { id: uuid(), title: "Untitled", blocks: [{ type: "paragraph", content: "" }], categoryId, icon: "📄" };
    setCategories((prev) => {
      const index = prev.findIndex((c) => c.id === categoryId);
      if (index === -1) return prev;
      const newCats = prev.slice();
      const cat = { ...newCats[index], pages: [...(newCats[index].pages || []), newPage] };
      newCats[index] = cat;
      return newCats;
    });
    setActivePageId(newPage.id);
  }, []);

  const updatePageTitle = useCallback((title: string) => {
    if (!activePageId) return;
    setCategories((prev) => {
      const catIndex = prev.findIndex((c) => (c.pages || []).some((p) => p.id === activePageId));
      if (catIndex === -1) return prev;
      const pageIndex = (prev[catIndex].pages || []).findIndex((p) => p.id === activePageId);
      if (pageIndex === -1) return prev;
      const newCats = prev.slice();
      const catCopy = { ...newCats[catIndex] };
      const pagesCopy = catCopy.pages ? catCopy.pages.slice() : [];
      pagesCopy[pageIndex] = { ...pagesCopy[pageIndex], title };
      catCopy.pages = pagesCopy;
      newCats[catIndex] = catCopy;
      return newCats;
    });
  }, [activePageId]);

  const deletePage = useCallback((pageId: string) => {
    const totalPages = categories.reduce((sum, cat) => sum + (cat.pages?.length || 0), 0);
    if (totalPages <= 1) return alert("Cannot delete the last page");
    setCategories((prev) => prev.map((cat) => ({ ...cat, pages: (cat.pages || []).filter((p) => p && p.id !== pageId) })));
    if (activePageId === pageId) {
      const remaining = allPages.filter((p) => p.id !== pageId);
      if (remaining.length > 0) setActivePageId(remaining[0].id);
      else setActivePageId("");
    }
  }, [categories, activePageId, allPages]);

  const createCategory = useCallback(() => {
    const newCategory: Category = { id: uuid(), name: "New Category", icon: "📁", isExpanded: true, pages: [] };
    setCategories((prev) => {
      const next = [...(prev || []), newCategory];
      const totalPages = next.reduce((s, c) => s + (c.pages?.length || 0), 0);
      if (totalPages === 0) {
        const starter: Page = { id: uuid(), title: "Untitled", blocks: [{ type: "paragraph", content: "" }], categoryId: newCategory.id, icon: "📄" };
        newCategory.pages = [starter];
        setActivePageId(starter.id);
      }
      return next;
    });
  }, []);

  const updateCategoryName = useCallback((categoryId: string, name: string) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === categoryId);
      if (idx === -1) return prev;
      const newCats = prev.slice();
      newCats[idx] = { ...newCats[idx], name };
      return newCats;
    });
  }, []);

  const toggleCategoryExpanded = useCallback((categoryId: string) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === categoryId);
      if (idx === -1) return prev;
      const newCats = prev.slice();
      newCats[idx] = { ...newCats[idx], isExpanded: !newCats[idx].isExpanded };
      return newCats;
    });
  }, []);

  const setCategoryFolder = useCallback(async (categoryId?: string) => {
    try {
      const targetCategoryId = categoryId || categories.find((c) => (c.pages || []).some((p) => p.id === activePageId))?.id;
      if (!targetCategoryId) return alert("No category selected to choose a folder for.");
      const folderPath = await chooseFolder();
      if (folderPath) {
        setCategories((prev) => {
          const idx = prev.findIndex((c) => c.id === targetCategoryId);
          if (idx === -1) return prev;
          const newCats = prev.slice();
          newCats[idx] = { ...newCats[idx], folderPath };
          return newCats;
        });
      }
    } catch (error) {
      console.error("Failed to choose folder:", error);
    }
  }, [categories, activePageId]);

  const deleteCategory = useCallback((catId: string) => {
    setCategories((prev) => {
      if ((prev || []).length <= 1) { alert("Cannot delete the last category"); return prev; }
      const newCats = (prev || []).filter((c) => c.id !== catId);
      const stillExists = newCats.flatMap((c) => c.pages || []).find((p) => p.id === activePageId);
      if (!stillExists) {
        const fallback = newCats[0]?.pages?.[0];
        if (fallback) setActivePageId(fallback.id);
        else setActivePageId("");
      }
      return newCats;
    });
  }, [activePageId]);

  const openIconPicker = useCallback((event: React.MouseEvent, forType: "category" | "page", id: string) => {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setIconPicker({ visible: true, x: rect.left, y: rect.bottom + 6, forType, id });
    setContextMenu((prev) => ({ ...prev, visible: false, type: null, categoryId: null }));
  }, []);

  const onEmojiSelect = useCallback((emoji: any) => {
    const native = emoji.native || (emoji.colons ? emoji.colons : undefined) || emoji.id;
    if (!native) return;
    if (iconPicker.forType === "category" && iconPicker.id) {
      setCategories((prev) => {
        const idx = prev.findIndex((c) => c.id === iconPicker.id);
        if (idx === -1) return prev;
        const newCats = prev.slice();
        newCats[idx] = { ...newCats[idx], icon: native };
        return newCats;
      });
    }
    if (iconPicker.forType === "page" && iconPicker.id) {
      setCategories((prev) => prev.map((cat) => ({ ...cat, pages: (cat.pages || []).map((p) => p.id === iconPicker.id ? { ...p, icon: native } : p) })));
    }
    setIconPicker({ visible: false, x: 0, y: 0, forType: null, id: null });
  }, [iconPicker.forType, iconPicker.id]);

  // Context menu events using global custom events dispatched by children
  useEffect(() => {
    const onCategoryContext = (e: any) => {
      const { x, y, id } = e.detail || {};
      setContextMenu({ visible: true, x, y, type: "category", categoryId: id });
    };
    const onSidebarContext = (e: any) => {
      const { x, y } = e.detail || {};
      setContextMenu({ visible: true, x, y, type: "sidebar", categoryId: null });
    };
    window.addEventListener("oxilia:category-context", onCategoryContext);
    window.addEventListener("oxilia:sidebar-context", onSidebarContext);
    return () => {
      window.removeEventListener("oxilia:category-context", onCategoryContext);
      window.removeEventListener("oxilia:sidebar-context", onSidebarContext);
    };
  }, []);

  if (isLoading) return <div className="loading-screen"><h2>Loading...</h2></div>;

  return (
    <div className="app">
      <Sidebar
        categories={categories}
        activePageId={activePageId}
        setActivePageId={setActivePageId}
        createCategory={createCategory}
        toggleCategoryExpanded={toggleCategoryExpanded}
        updateCategoryName={updateCategoryName}
        deletePage={deletePage}
        openIconPicker={openIconPicker}
      />

      <main className="main-content">
        {activePage && editorRef.current ? (
          <>
            <div className="page-header">
              <button className="icon-button header-icon" onClick={(ev) => openIconPicker(ev, "page", activePage.id)} title="Change page icon">
                <span className="icon-text">{activePage.icon || "📄"}</span>
              </button>

              <input className="title-input" value={activePage.title || ""} onChange={e => updatePageTitle(e.target.value)} placeholder="Page title..." />
            </div>

            <EditorView editorRef={editorRef} activePage={activePage} />
          </>
        ) : (
          <div className="no-page-selected">
            <h3>No page selected</h3>
            <p>Create a new page or select an existing one to get started</p>
          </div>
        )}
      </main>

      <ContextMenu
        context={contextMenu}
        onClose={() => setContextMenu({ visible: false, x: 0, y: 0, type: null, categoryId: null })}
        createPage={createPage}
        createCategory={createCategory}
        updateCategoryName={updateCategoryName}
        deleteCategory={deleteCategory}
        setCategoryFolder={setCategoryFolder}
      />

      <IconPicker visible={iconPicker.visible} x={iconPicker.x} y={iconPicker.y} onSelect={onEmojiSelect} />
    </div>
  );
}