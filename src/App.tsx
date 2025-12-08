import { useEffect, useState, useMemo } from "react";
import { v4 as uuid } from "uuid";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { loadDB, saveDB } from "./lib/storage";
import type { Page } from "./types";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import "./index.css";

export default function App() {
  const [pages, setPages] = useState<Page[]>([]);
  const [activeId, setActiveId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  useEffect(() => {
    try {
      const data = loadDB();
      setPages(data);
      if (data.length > 0) {
        setActiveId(data[0].id);
      } else {
        // Create initial page if none exist
        const initialPage: Page = {
          id: uuid(),
          title: "Welcome to O-Xilia",
          blocks: [
            {
              type: "paragraph",
              content: "Start writing your first note..."
            }
          ]
        };
        setPages([initialPage]);
        setActiveId(initialPage.id);
      }
    } catch (error) {
      console.error("Failed to load pages:", error);
      // Create a default page on error
      const fallbackPage: Page = {
        id: uuid(),
        title: "Untitled",
        blocks: []
      };
      setPages([fallbackPage]);
      setActiveId(fallbackPage.id);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update page title when active page changes
  useEffect(() => {
    const activePage = pages.find((p) => p.id === activeId);
    if (activePage?.title) {
      document.title = `${activePage.title} - O-Xilia`;
    } else {
      document.title = "O-Xilia";
    }
  }, [activeId, pages]);

  // Get current active page
  const activePage = useMemo(() => {
    return pages.find((p) => p.id === activeId);
  }, [pages, activeId]);

  // Create editor with validated content
  const editor = useCreateBlockNote({
    initialContent: useMemo(() => {
      if (!activePage?.blocks || activePage.blocks.length === 0) {
        // Return valid default content instead of empty array
        return [
          {
            type: "paragraph" as const,
            content: ""
          }
        ];
      }
      
      // Validate and clean the blocks
      const validBlocks = activePage.blocks.filter(block => 
        block && 
        typeof block === 'object' && 
        block.type && 
        block.content !== undefined
      );
      
      return validBlocks.length > 0 ? validBlocks : [
        {
          type: "paragraph" as const,
          content: ""
        }
      ];
    }, [activePage?.blocks])
  });

  // Auto-save blocks when content changes
  useEffect(() => {
    if (!activeId || !editor || isLoading) return;

    const handleContentChange = () => {
      try {
        const currentBlocks = editor.topLevelBlocks;
        if (currentBlocks && Array.isArray(currentBlocks)) {
          setPages((prev) =>
            prev.map((p) =>
              p.id === activeId ? { ...p, blocks: currentBlocks } : p
            )
          );
        }
      } catch (error) {
        console.error("Failed to update blocks:", error);
      }
    };

    // Add event listener
    const unsubscribe = editor.onChange(handleContentChange);
    
    return () => {
      // Clean up listener when component unmounts or page changes
      if (unsubscribe) unsubscribe();
    };
  }, [activeId, editor, isLoading]);

  // Save to localStorage
  useEffect(() => {
    if (pages.length > 0 && !isLoading) {
      try {
        saveDB(pages);
      } catch (error) {
        console.error("Failed to save pages:", error);
      }
    }
  }, [pages, isLoading]);

  const addPage = () => {
    const id = uuid();
    const newPage: Page = {
      id,
      title: "Untitled",
      blocks: []
    };
    setPages((p) => [...p, newPage]);
    setActiveId(id);
  };

  const setTitle = (title: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === activeId ? { ...p, title } : p))
    );
  };

  const deletePage = (id: string) => {
    if (pages.length <= 1) {
      alert("Cannot delete the last page");
      return;
    }
    
    const newPages = pages.filter((p) => p.id !== id);
    setPages(newPages);
    
    if (activeId === id) {
      setActiveId(newPages[0]?.id || "");
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>O-Xilia</h2>
          <button onClick={addPage} className="new-page-btn">
            + New Page
          </button>
        </div>
        <ul className="pages-list">
          {pages.map((page) => (
            <li
              key={page.id}
              className={`page-item ${page.id === activeId ? "active" : ""}`}
              onClick={() => setActiveId(page.id)}
            >
              <span className="page-title">
                {page.title || "Untitled"}
              </span>
              <button 
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deletePage(page.id);
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {activePage ? (
          <>
            <input
              className="title-input"
              value={activePage.title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title..."
            />
            <div className="editor-container">
              <BlockNoteView editor={editor} />
            </div>
          </>
        ) : (
          <div className="welcome">
            <h1>Welcome to O-Xilia</h1>
            <p>Create a new page or select an existing one to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}