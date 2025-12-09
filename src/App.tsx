// App.tsx - Notion-style icons + inline emoji picker for categories & pages
import { useEffect, useState } from "react";
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
  const [editor, setEditor] = useState<BlockNoteEditor | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
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

  // -------- LOAD DATA ----------
  useEffect(() => {
    async function init() {
      try {
        const data = await loadDB();
        if (data && data.length > 0) {
          setCategories(data);

          const firstCategoryWithPages = data.find(cat => (cat.pages || []).length > 0);
          if (firstCategoryWithPages) {
            setActivePageId(prev => prev || firstCategoryWithPages.pages![0].id);
          }
        } else {
          // default
          const defaultPage: Page = {
            id: uuid(),
            title: "Welcome to O-Xilia",
            blocks: [{ type: "paragraph", content: "Start your first note..." }],
            categoryId: "default-category",
            icon: "📄"
          };

          const defaultCategory: Category = {
            id: "default-category",
            name: "Default",
            icon: "📁",
            isExpanded: true,
            pages: [defaultPage]
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
          icon: "📄"
        };
        const fallbackCategory: Category = {
          id: "fallback-category",
          name: "Default",
          icon: "📁",
          isExpanded: true,
          pages: [fallbackPage]
        };
        setCategories([fallbackCategory]);
        setActivePageId(fallbackPage.id);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // -------- CREATE EDITOR ----------
  useEffect(() => {
    if (isLoading) return;

    const activePage = categories.flatMap(cat => cat.pages || []).find(p => p && p.id === activePageId);
    if (!activePage) return;

    if (!editor) {
      const e = BlockNoteEditor.create({
        initialContent: activePage.blocks || []
      });
      setEditor(e);
    } else {
      const activePageNow = categories.flatMap(cat => cat.pages || []).find(p => p && p.id === activePageId);
      if (activePageNow) {
        try {
          editor.replaceBlocks(editor.document, activePageNow.blocks || []);
        } catch (err) {
          console.warn("Failed to replace blocks on editor (API mismatch?):", err);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageId, isLoading]);

  // -------- HANDLE BLOCKNOTE CHANGES ----------
  useEffect(() => {
    if (!editor || isLoading) return;

    const unsub = editor.onChange(() => {
      const blocks = editor.document;

      setCategories(prev =>
        prev.map(category => ({
          ...category,
          pages: (category.pages || []).map(page =>
            page && page.id === activePageId ? { ...page, blocks } : page
          )
        }))
      );
    });

    return () => unsub && unsub();
  }, [editor, activePageId, isLoading]);

  // -------- AUTO-SAVE ----------
  useEffect(() => {
    if (!isLoading && categories && categories.length > 0) {
      const timeout = setTimeout(() => saveDB(categories), 300);
      return () => clearTimeout(timeout);
    }
  }, [categories, isLoading]);

  // Close context menu & icon picker on outside click
  useEffect(() => {
    const closeAll = () => {
      setContextMenu(prev => ({ ...prev, visible: false, type: null, categoryId: null }));
      setIconPicker(prev => ({ ...prev, visible: false, forType: null, id: null }));
    };
    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);

  // -------- ACTIONS ----------
  const createPage = (categoryId: string) => {
    const newPage: Page = {
      id: uuid(),
      title: "Untitled",
      blocks: [{ type: "paragraph", content: "" }],
      categoryId,
      icon: "📄"
    };

    setCategories(prev =>
      prev.map(cat =>
        cat && cat.id === categoryId
          ? { ...cat, pages: [...(cat.pages || []), newPage] }
          : cat
      )
    );

    setActivePageId(newPage.id);
  };

  const updatePageTitle = (title: string) => {
    if (!activePageId) return;

    setCategories(prev =>
      prev.map(category => ({
        ...category,
        pages: (category.pages || []).map(page =>
          page && page.id === activePageId ? { ...page, title } : page
        )
      }))
    );
  };

  const deletePage = (pageId: string) => {
    const totalPages = categories.reduce((sum, cat) => sum + (cat.pages?.length || 0), 0);
    if (totalPages <= 1) return alert("Cannot delete the last page");

    setCategories(prev =>
      prev.map(category => ({
        ...category,
        pages: (category.pages || []).filter(page => page && page.id !== pageId)
      }))
    );

    if (activePageId === pageId) {
      setCategories(prev => {
        const remainingPages = prev.flatMap(cat => cat.pages || []).filter(p => p && p.id !== pageId);
        const newActivePage = remainingPages.length > 0 ? remainingPages[0] : undefined;
        if (newActivePage) setActivePageId(newActivePage.id);
        return prev;
      });
    }
  };

  const createCategory = (opts?: { name?: string; focus?: boolean }) => {
    const newCategory: Category = {
      id: uuid(),
      name: opts?.name || "New Category",
      icon: "📁",
      isExpanded: true,
      pages: []
    };

    setCategories(prev => {
      const next = [...(prev || []), newCategory];
      const totalPages = next.reduce((s, c) => s + (c.pages?.length || 0), 0);
      if (totalPages === 0) {
        const starter: Page = {
          id: uuid(),
          title: "Untitled",
          blocks: [{ type: "paragraph", content: "" }],
          categoryId: newCategory.id,
          icon: "📄"
        };
        newCategory.pages = [starter];
        setActivePageId(starter.id);
      }
      return next;
    });
  };

  const updateCategoryName = (categoryId: string, name: string) => {
    setCategories(prev =>
      (prev || []).map(cat =>
        cat && cat.id === categoryId ? { ...cat, name } : cat
      )
    );
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setCategories(prev =>
      (prev || []).map(cat =>
        cat && cat.id === categoryId ? { ...cat, isExpanded: !cat.isExpanded } : cat
      )
    );
  };

  // Choose folder for a specific category. If no categoryId provided, we'll try to use active page's category
  const setCategoryFolder = async (categoryId?: string) => {
    try {
      const targetCategoryId = categoryId || categories.find(c => (c.pages || []).some(p => p.id === activePageId))?.id;
      if (!targetCategoryId) return alert("No category selected to choose a folder for.");

      const folderPath = await chooseFolder();
      if (folderPath) {
        setCategories(prev =>
          (prev || []).map(cat =>
            cat && cat.id === targetCategoryId ? { ...cat, folderPath } : cat
          )
        );
      }
    } catch (error) {
      console.error("Failed to choose folder:", error);
    }
  };

  const deleteCategory = (catId: string) => {
    setCategories(prev => {
      if ((prev || []).length <= 1) {
        alert("Cannot delete the last category");
        return prev;
      }

      const newCats = (prev || []).filter(c => c.id !== catId);

      const stillExists = newCats.flatMap(c => c.pages || []).find(p => p.id === activePageId);
      if (!stillExists) {
        const fallback = newCats[0]?.pages?.[0];
        if (fallback) setActivePageId(fallback.id);
        else setActivePageId("");
      }

      return newCats;
    });
  };

  // Open inline icon picker under the clicked icon (Notion-style)
  const openIconPicker = (event: React.MouseEvent, forType: "category" | "page", id: string) => {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    // place picker under the icon (Notion-like)
    setIconPicker({
      visible: true,
      x: rect.left,
      y: rect.bottom + 6,
      forType,
      id
    });
    // prevent contextMenu from interfering
    setContextMenu(prev => ({ ...prev, visible: false, type: null, categoryId: null }));
  };

  const onEmojiSelect = (emoji: any) => {
    const native = emoji.native || (emoji.colons ? emoji.colons : undefined) || emoji.id;
    if (!native) return;
    if (iconPicker.forType === "category" && iconPicker.id) {
      setCategories(prev => (prev || []).map(cat => cat.id === iconPicker.id ? { ...cat, icon: native } : cat));
    }
    if (iconPicker.forType === "page" && iconPicker.id) {
      setCategories(prev => (prev || []).map(cat => ({
        ...cat,
        pages: (cat.pages || []).map(p => p.id === iconPicker.id ? { ...p, icon: native } : p)
      })));
    }
    setIconPicker({ visible: false, x: 0, y: 0, forType: null, id: null });
  };

  if (isLoading) return <div className="loading-screen"><h2>Loading...</h2></div>;

  const activePage = categories.flatMap(cat => cat.pages || []).find(page => page && page.id === activePageId);

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
          setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            type: "sidebar",
            categoryId: null
          });
        }}
      >
        <div className="sidebar-header">
          <img src="./assets/OxiliaLogo.svg" alt="" className="Logo"/>
          O-Xilia
        </div>

        <div className="categories-list">
          {categories && categories.map(category => (
            <div key={category?.id} className="category">
              <div
                className="category-header"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    type: "category",
                    categoryId: category.id
                  });
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
                  {category?.pages && category.pages.map(page => (
                    <div
                      key={page?.id}
                      className={`page-item ${page?.id === activePageId ? 'active' : ''}`}
                      onClick={() => {
                        setActivePageId(page?.id);
                      }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePage(page?.id);
                        }}
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
            style={{
              position: "fixed",
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 9999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => {
              if (contextMenu.categoryId) createPage(contextMenu.categoryId);
              setContextMenu({ visible: false, x: 0, y: 0, type: null, categoryId: null });
            }}>
              ➕ Add Page
            </button>

            <button onClick={() => {
              const newName = prompt("Rename category:");
              if (newName && contextMenu.categoryId) updateCategoryName(contextMenu.categoryId, newName);
              setContextMenu({ visible: false, x: 0, y: 0, type: null, categoryId: null });
            }}>
              ✏️ Rename
            </button>

            <button onClick={() => {
              if (contextMenu.categoryId) deleteCategory(contextMenu.categoryId);
              setContextMenu({ visible: false, x: 0, y: 0, type: null, categoryId: null });
            }}>
              ❌ Delete
            </button>

            <button onClick={() => {
              if (contextMenu.categoryId) setCategoryFolder(contextMenu.categoryId);
              setContextMenu({ visible: false, x: 0, y: 0, type: null, categoryId: null });
            }}>
              📁 Choose Folder...
            </button>
          </div>
        )}

        {contextMenu.visible && contextMenu.type === "sidebar" && (
          <div
            className="context-menu"
            style={{
              position: "fixed",
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 9999
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => {
              createCategory();
              setContextMenu({ visible: false, x: 0, y: 0, type: null, categoryId: null });
            }}>
              ➕ New Category
            </button>
          </div>
        )}

        {/* Inline emoji picker (Notion-style) */}
        {iconPicker.visible && (
            <div
            className="icon-picker-wrapper"
            style={{
              position: "fixed",
              top: `${iconPicker.y}px`,
              left: `${iconPicker.x}px`,
              zIndex: 10000
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
            <Picker
            data={data}
            theme="dark"
            onEmojiSelect={(emoji: any) => onEmojiSelect(emoji)}
            />
            </div>
        )}
      </aside>

      <main className="main-content">
        {activePage && editor ? (
          <>
            <div className="page-header">
              <button
                className="icon-button header-icon"
                onClick={(ev) => openIconPicker(ev, "page", activePage.id)}
                title="Change page icon"
              >
                <span className="icon-text">{activePage.icon || "📄"}</span>
              </button>

              <input
                className="title-input"
                value={activePage.title || ""}
                onChange={e => updatePageTitle(e.target.value)}
                placeholder="Page title..."
              />
            </div>

            <div className="editor-container">
              <BlockNoteView editor={editor} />
            </div>
          </>
        ) : (
          <div className="no-page-selected">
            <h3>No page selected</h3>
            <p>Create a new page or select an existing one to get started</p>
          </div>
        )}
      </main>
    </div>
  );
}
