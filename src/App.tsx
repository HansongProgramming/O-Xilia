// App.tsx - Fixed to work with JSON saving
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteEditor } from "@blocknote/core";
import { loadDB, saveDB, chooseFolder } from "./lib/storage";
import type { Category, Page } from "./types";

import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import "./index.css";

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activePageId, setActivePageId] = useState<string>("");
  const [editor, setEditor] = useState<BlockNoteEditor | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // -------- LOAD DATA ----------
  useEffect(() => {
    async function init() {
      try {
        const data = await loadDB();
        if (data && data.length > 0) {
          setCategories(data);

          // Set initial active page
          const firstCategoryWithPages = data.find(cat => cat.pages && cat.pages.length > 0);
          if (firstCategoryWithPages && firstCategoryWithPages.pages && firstCategoryWithPages.pages.length > 0) {
            setActivePageId(firstCategoryWithPages.pages[0].id);
          }
        } else {
          // Create default category and page
          const defaultPage: Page = {
            id: uuid(),
            title: "Welcome to O-Xilia",
            blocks: [{ type: "paragraph", content: "Start your first note..." }],
            categoryId: "default-category"
          };

          const defaultCategory: Category = {
            id: "default-category",
            name: "Default",
            isExpanded: true,
            pages: [defaultPage]
          };

          setCategories([defaultCategory]);
          setActivePageId(defaultPage.id);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        // Create fallback
        const fallbackPage: Page = {
          id: uuid(),
          title: "Untitled",
          blocks: [{ type: "paragraph", content: "" }],
          categoryId: "fallback-category"
        };
        const fallbackCategory: Category = {
          id: "fallback-category",
          name: "Default",
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

    const activePage = categories
      .flatMap(cat => cat.pages || [])
      .find(page => page && page.id === activePageId);

    if (!activePage) return;

    if (!editor) {
      const e = BlockNoteEditor.create({
        initialContent: activePage.blocks || []
      });
      setEditor(e);
    } else {
      const activePageNow = categories
        .flatMap(cat => cat.pages || [])
        .find(page => page && page.id === activePageId);

      if (activePageNow) {
        editor.replaceBlocks(editor.document, activePageNow.blocks || []);
      }
    }
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
            page && page.id === activePageId
              ? { ...page, blocks }
              : page
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

  // -------- ACTIONS ----------
  const createPage = (categoryId: string) => {
    const newPage: Page = {
      id: uuid(),
      title: "Untitled",
      blocks: [{ type: "paragraph", content: "" }],
      categoryId
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
      const remainingPages = categories.flatMap(cat => cat.pages || []).filter(p => p && p.id !== pageId);
      const newActivePage = remainingPages.length > 0 ? remainingPages[0] : null;
      setActivePageId(newActivePage?.id || "");
    }
  };

  const createCategory = () => {
    const newCategory: Category = {
      id: uuid(),
      name: "New Category",
      isExpanded: true,
      pages: []
    };

    setCategories(prev => [...(prev || []), newCategory]);
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

  const setCategoryFolder = async (categoryId: string) => {
    try {
      const folderPath = await chooseFolder();
      if (folderPath) {
        setCategories(prev =>
          (prev || []).map(cat =>
            cat && cat.id === categoryId ? { ...cat, folderPath } : cat
          )
        );
      }
    } catch (error) {
      console.error("Failed to choose folder:", error);
    }
  };

  if (isLoading) return <div className="loading-screen"><h2>Loading...</h2></div>;

  const activePage = categories
    .flatMap(cat => cat.pages || [])
    .find(page => page && page.id === activePageId);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>O-Xilia</h2>
          <button className="create-category-btn" onClick={createCategory}>+ New Category</button>
          <button onClick={() => setCategoryFolder("global")}>Choose Folder</button>
        </div>

        <div className="categories-list">
          {categories && categories.map(category => (
            <div key={category?.id} className="category">
              <div className="category-header">
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
                <button
                  onClick={() => createPage(category?.id)}
                  className="add-page-btn"
                  title="Add page to category"
                >
                  +
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
      </aside>

      <main className="main-content">
        {activePage && editor ? (
          <>
            <input
              className="title-input"
              value={activePage.title || ""}
              onChange={e => updatePageTitle(e.target.value)}
              placeholder="Page title..."
            />
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