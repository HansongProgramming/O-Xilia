// App.tsx - Fixed async issue
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { loadDB, saveDB, chooseFolder } from "./lib/storage";
import type { Category, Page } from "./types";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import "./index.css";

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activePageId, setActivePageId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await loadDB();
        setCategories(data);
        
        // Set initial active page
        if (data.length > 0) {
          const firstCategoryWithPages = data.find(cat => cat.pages.length > 0);
          if (firstCategoryWithPages) {
            setActivePageId(firstCategoryWithPages.pages[0].id);
            setSelectedCategoryId(firstCategoryWithPages.id);
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get current active page
  const activePage = categories
    .flatMap(cat => cat.pages)
    .find(page => page.id === activePageId);

  const editor = useCreateBlockNote(
    activePage?.blocks?.length ? { initialContent: activePage.blocks } : undefined
  );

  // Auto-save blocks while typing
  useEffect(() => {
    if (!activePageId) return;
    
    const unsubscribe = editor.onEditorContentChange(() => {
      setCategories(prev => 
        prev.map(category => ({
          ...category,
          pages: category.pages.map(page => 
            page.id === activePageId 
              ? { ...page, blocks: editor.topLevelBlocks }
              : page
          )
        }))
      );
    });

    return () => {
      // Cleanup the subscription
      // Note: BlockNote might have a different cleanup method
      // You may need to adjust this based on their API
    };
  }, [activePageId, editor]);

  // Persist data when categories change
  useEffect(() => {
    if (categories.length > 0 && !loading) {
      saveDB(categories);
    }
  }, [categories, loading]);

  // Loading state
  if (loading) {
    return (
      <div className="loading-screen">
        <h2>Loading O-Xilia...</h2>
      </div>
    );
  }

  // Category management functions
  const createCategory = () => {
    const newCategory: Category = {
      id: uuid(),
      name: "New Category",
      isExpanded: true,
      pages: []
    };
    
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategoryName = (categoryId: string, name: string) => {
    setCategories(prev =>
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, name } : cat
      )
    );
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setCategories(prev =>
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, isExpanded: !cat.isExpanded } : cat
      )
    );
  };

  const setCategoryFolder = async (categoryId: string) => {
    try {
      const folderPath = await chooseFolder();
      if (folderPath) {
        setCategories(prev =>
          prev.map(cat => 
            cat.id === categoryId ? { ...cat, folderPath } : cat
          )
        );
      }
    } catch (error) {
      console.error("Failed to choose folder:", error);
    }
  };

  // Page management functions
  const createPage = (categoryId: string) => {
    const newPage: Page = {
      id: uuid(),
      title: "Untitled",
      blocks: [],
      categoryId
    };
    
    setCategories(prev =>
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, pages: [...cat.pages, newPage] }
          : cat
      )
    );
    
    setActivePageId(newPage.id);
    setSelectedCategoryId(categoryId);
  };

  const updatePageTitle = (title: string) => {
    if (!activePageId) return;
    
    setCategories(prev =>
      prev.map(category => ({
        ...category,
        pages: category.pages.map(page => 
          page.id === activePageId ? { ...page, title } : page
        )
      }))
    );
  };

  const deletePage = (pageId: string) => {
    setCategories(prev =>
      prev.map(category => ({
        ...category,
        pages: category.pages.filter(page => page.id !== pageId)
      }))
    );
    
    if (activePageId === pageId) {
      // Find a new active page
      const remainingPages = categories.flatMap(cat => cat.pages);
      const newActivePage = remainingPages.find(p => p.id !== pageId);
      setActivePageId(newActivePage?.id || "");
    }
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>O-Xilia</h2>
          <button onClick={createCategory} className="create-category-btn">
            + New Category
          </button>
        </div>
        
        <div className="categories-list">
          {categories.map(category => (
            <div key={category.id} className="category">
              <div className="category-header">
                <button 
                  className="category-toggle"
                  onClick={() => toggleCategoryExpanded(category.id)}
                >
                  {category.isExpanded ? "▼" : "▶"}
                </button>
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => updateCategoryName(category.id, e.target.value)}
                  className="category-name-input"
                />
                <div className="category-actions">
                  <button 
                    onClick={() => setCategoryFolder(category.id)}
                    className="settings-btn"
                    title="Set folder location"
                  >
                    ⚙️
                  </button>
                  <button 
                    onClick={() => createPage(category.id)}
                    className="add-page-btn"
                    title="Add page to category"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {category.isExpanded && (
                <div className="pages-list">
                  {category.pages.map(page => (
                    <div 
                      key={page.id}
                      className={`page-item ${page.id === activePageId ? 'active' : ''}`}
                      onClick={() => {
                        setActivePageId(page.id);
                        setSelectedCategoryId(category.id);
                      }}
                    >
                      <span className="page-title">{page.title || "Untitled"}</span>
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
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="editor-container">
        {activePage ? (
          <>
            <input
              type="text"
              value={activePage.title}
              onChange={(e) => updatePageTitle(e.target.value)}
              placeholder="Untitled"
              className="page-title-input"
            />
            <BlockNoteView editor={editor} />
          </>
        ) : (
          <div className="no-page-selected">
            <h3>No page selected</h3>
            <p>Create a new page or select an existing one to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}