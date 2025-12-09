import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteEditor } from "@blocknote/core";
import { loadDB, saveDB, chooseFolder } from "./lib/storage";
import type { Category, Page } from "./types";

import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import "./index.css";

type ContextMenuState = {
  visible: boolean;
  x: number;
  y: number;
  type: "category" | "sidebar" | null;
  categoryId: string | null;
};

type IconPickerState = {
  visible: boolean;
  x: number;
  y: number;
  forType: "category" | "page" | null;
  id: string | null;
};

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activePageId, setActivePageId] = useState<string>("");
  const editorRef = useRef<BlockNoteEditor | null>(null);
  const lastLoadedBlocksRef = useRef<any[] | null>(null);
  const isMountedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, type: null, categoryId: null });
  const [iconPicker, setIconPicker] = useState<IconPickerState>({ visible: false, x: 0, y: 0, forType: null, id: null });

  // Debounce / timer refs
  const saveTimerRef = useRef<number | null>(null);
  const editorChangeTimerRef = useRef<number | null>(null);

  // -------- LOAD DATA (once) ----------
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const dataDB = await loadDB();
        if (cancelled) return;

        if (dataDB && dataDB.length > 0) {
          setCategories(dataDB);

          const firstCategoryWithPages = dataDB.find((cat) => (cat.pages || []).length > 0);
          if (firstCategoryWithPages) {
            setActivePageId((prev) => prev || firstCategoryWithPages.pages![0].id);
          }
        } else {
          const defaultPage: Page = {
            id: uuid(),
            title: "Welcome to O-Xilia",
            blocks: [{ type: "paragraph", content: "Start your first note..." }],
            categoryId: "default-category",
            icon: "📄",
          };

          const defaultCategory: Category = {
            id: "default-category",
            name: "Default",
            icon: "📁",
            isExpanded: true,
            pages: [defaultPage],
          };

          setCategories([defaultCategory]);
          setActivePageId(defaultPage.id);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        const fallbackPage: Page = {
          id: uuid(),
          title: "Untitled",
          blocks: [{ type: "paragraph", content: "" }],
          categoryId: "fallback-category",
          icon: "📄",
        };
        const fallbackCategory: Category = {
          id: "fallback-category",
          name: "Default",
          icon: "📁",
          isExpanded: true,
          pages: [fallbackPage],
        };
        setCategories([fallbackCategory]);
        setActivePageId(fallbackPage.id);
      } finally {
        setIsLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const allPages = useMemo(() => categories.flatMap((cat) => cat.pages || []), [categories]);

  const activePage = useMemo(() => allPages.find((p) => p && p.id === activePageId), [allPages, activePageId]);

  useEffect(() => {
    if (isLoading) return;
    if (!editorRef.current) {
      editorRef.current = BlockNoteEditor.create({ initialContent: activePage?.blocks || [] });

      // onChange handler - debounced
      editorRef.current.onChange(() => {
        if (editorChangeTimerRef.current) window.clearTimeout(editorChangeTimerRef.current);
        // debounce editor changes and then update categories (only update the modified page)
        editorChangeTimerRef.current = window.setTimeout(() => {
          try {
            const blocks = editorRef.current?.document || [];
            if (!activePage) return;
            // update only the page that changed
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

      // Quick shallow check - if lengths differ or JSON differs, replace
      const needsReplace = currentDoc.length !== incoming.length || JSON.stringify(lastLoadedBlocksRef.current) !== JSON.stringify(incoming);
      if (needsReplace) {
        try {
          // Keep a snapshot so future compares are meaningful
          lastLoadedBlocksRef.current = incoming;
          // replaceBlocks may be implementation-specific; try-catch to gracefully degrade
          try {
            editorRef.current.replaceBlocks(editorRef.current.document, incoming);
          } catch (err) {
            // Some versions of BlockNote might use a different API - fallback to re-creating editor
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
    saveTimerRef.current = window.setTimeout(() => {
      try {
        saveDB(categories);
      } catch (err) {
        console.error("Failed to save DB:", err);
      }
    }, 800);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [categories, isLoading]);

  useEffect(() => {
    if (!iconPicker.visible && !contextMenu.visible) return;

    const closeAll = () => {
      setContextMenu((prev) => ({ ...prev, visible: false, type: null, categoryId: null }));
      setIconPicker((prev) => ({ ...prev, visible: false, forType: null, id: null }));
    };

    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, [iconPicker.visible, contextMenu.visible]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // -------- ACTIONS ----------
  const createPage = useCallback((categoryId: string) => {
    const newPage: Page = {
      id: uuid(),
      title: "Untitled",
      blocks: [{ type: "paragraph", content: "" }],
      categoryId,
      icon: "📄",
    };

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

    setCategories((prev) => {
      const newCats = prev.map((cat) => ({ ...cat, pages: (cat.pages || []).filter((p) => p && p.id !== pageId) }));
      return newCats;
    });

    if (activePageId === pageId) {
      const remaining = allPages.filter((p) => p.id !== pageId);
      if (remaining.length > 0) setActivePageId(remaining[0].id);
      else setActivePageId("");
    }
  }, [categories, activePageId, allPages]);

  const createCategory = useCallback((opts?: { name?: string; focus?: boolean }) => {
    const newCategory: Category = {
      id: uuid(),
      name: opts?.name || "New Category",
      icon: "📁",
      isExpanded: true,
      pages: [],
    };

    setCategories((prev) => {
      const next = [...(prev || []), newCategory];
      const totalPages = next.reduce((s, c) => s + (c.pages?.length || 0), 0);
      if (totalPages === 0) {
        const starter: Page = {
          id: uuid(),
          title: "Untitled",
          blocks: [{ type: "paragraph", content: "" }],
          categoryId: newCategory.id,
          icon: "📄",
        };
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
      if ((prev || []).length <= 1) {
        alert("Cannot delete the last category");
        return prev;
      }

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

  if (isLoading) return <div className="loading-screen"><h2>Loading...</h2></div>;

  return (
    <div className="app">
      <aside
        className="sidebar"
        onContextMenu={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest(".category") || target.closest(".category-header") || target.closest(".page-item")) {
            return;
          }
          e.preventDefault();
          setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type: "sidebar", categoryId: null });
        }}
      >
        <div className="sidebar-header">
          <img src="./assets/OxiliaLogo.svg" alt="" className="Logo" />
          O-Xilia
        </div>

        <div className="categories-list">
          {categories && categories.map((category) => (
            <div key={category?.id} className="category">
              <div
                className="category-header"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type: "category", categoryId: category.id });
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
                  value={category?.name || ""}
                  onChange={(e) => updateCategoryName(category?.id, e.target.value)}
                  className="category-name-input"
                />

                <button
                  className="category-toggle"
                  onClick={() => toggleCategoryExpanded(category?.id)}
                >
                  {category?.isExpanded ? "▼" : "▶"}
                </button>
              </div>

              {category?.isExpanded && (
                <div className="pages-list">
                  {category?.pages && category.pages.map((page) => (
                    <div
                      key={page?.id}
                      className={`page-item ${page?.id === activePageId ? 'active' : ''}`}
                      onClick={() => { setActivePageId(page?.id); }}
                    >
                      <button
                        className="icon-button page-icon"
                        onClick={(ev) => { ev.stopPropagation(); openIconPicker(ev, "page", page.id); }}
                        title="Change page icon"
                      >
                        <span className="icon-text">{page.icon || "📄"}</span>
                      </button>

                      <span className="page-title">{page?.title || "Untitled"}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deletePage(page?.id); }}
                        className="delete-page-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Context menus */}
        {contextMenu.visible && contextMenu.type === "category" && (
          <div
            className="context-menu"
            style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => { if (contextMenu.categoryId) createPage(contextMenu.categoryId); setContextMenu({ visible: false, x: 0, y: 0, type: null, categoryId: null }); }}>➕ Add Page</button>
            <button onClick={() => {
              const newName = prompt("Rename category:");
              if (newName && contextMenu.categoryId) updateCategoryName(contextMenu.categoryId, newName);
              setContextMenu({ visible: false, x: 0, y: 0, type: null, categoryId: null });
            }}>✏️ Rename</button>
            <button onClick={() => { if (contextMenu.categoryId) deleteCategory(contextMenu.categoryId); setContextMenu({ visible: false, x: 0, y: 0, type: null, categoryId: null }); }}>❌ Delete</button>
            <button onClick={() => { if (contextMenu.categoryId) setCategoryFolder(contextMenu.categoryId); setContextMenu({ visible: false, x: 0, y: 0, type: null, categoryId: null }); }}>📁 Choose Folder...</button>
          </div>
        )}

        {contextMenu.visible && contextMenu.type === "sidebar" && (
          <div className="context-menu" style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { createCategory(); setContextMenu({ visible: false, x: 0, y: 0, type: null, categoryId: null }); }}>➕ New Category</button>
          </div>
        )}

        {/* Inline emoji picker (Notion-style) - only render when visible */}
        {iconPicker.visible && (
          <div className="icon-picker-wrapper" style={{ position: "fixed", top: `${iconPicker.y}px`, left: `${iconPicker.x}px`, zIndex: 10000 }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Picker data={data} theme="dark" onEmojiSelect={(emoji: any) => onEmojiSelect(emoji)} />
          </div>
        )}
      </aside>

      <main className="main-content">
        {activePage && editorRef.current ? (
          <>
            <div className="page-header">
              <button className="icon-button header-icon" onClick={(ev) => openIconPicker(ev, "page", activePage.id)} title="Change page icon">
                <span className="icon-text">{activePage.icon || "📄"}</span>
              </button>

              <input className="title-input" value={activePage.title || ""} onChange={e => updatePageTitle(e.target.value)} placeholder="Page title..." />
            </div>

            <div className="editor-container">
              <BlockNoteView editor={editorRef.current} />
            </div>
          </>
        ) : (
          <div className="no-page-selected"><h3>No page selected</h3><p>Create a new page or select an existing one to get started</p></div>
        )}
      </main>
    </div>
  );
}
