import { useEffect, useState, useMemo } from "react";
import { v4 as uuid } from "uuid";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { loadDB, saveDB } from "./lib/storage"; // now uses IPC
import type { Page } from "./types";

import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import "./index.css";

export default function App() {
  const [pages, setPages] = useState<Page[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // -------- LOAD JSON FROM ELECTRON STORAGE --------
  useEffect(() => {
    async function init() {
      try {
        const data = await loadDB();

        if (data && data.length > 0) {
          setPages(data);
          setActiveId(data[0].id);
        } else {
          // Create a default page
          const initial: Page = {
            id: uuid(),
            title: "Welcome to O-Xilia",
            blocks: [
              {
                type: "paragraph",
                content: "Start your first note..."
              }
            ]
          };

          setPages([initial]);
          setActiveId(initial.id);
        }
      } catch (err) {
        console.error("Failed to load DB:", err);

        const fallback: Page = {
          id: uuid(),
          title: "Untitled",
          blocks: []
        };

        setPages([fallback]);
        setActiveId(fallback.id);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  // -------- UPDATE WINDOW TITLE ----------
  useEffect(() => {
    const page = pages.find(p => p.id === activeId);
    document.title = page?.title ? `${page.title} - O-Xilia` : "O-Xilia";
  }, [activeId, pages]);

  // -------- GET CURRENT PAGE ----------
  const activePage = useMemo(() => {
    return pages.find(p => p.id === activeId);
  }, [pages, activeId]);

  // -------- BLOCKNOTE EDITOR ----------
  const editor = useCreateBlockNote({
    initialContent: useMemo(() => {
      if (!activePage?.blocks?.length) {
        return [{ type: "paragraph", content: "" }];
      }

      const clean = activePage.blocks.filter(
        b => b && typeof b === "object" && b.type
      );

      return clean.length ? clean : [{ type: "paragraph", content: "" }];
    }, [activePage])
  });

  // -------- WHEN USER EDITS BLOCKNOTE --------
  useEffect(() => {
    if (!editor || isLoading) return;

    const unsub = editor.onChange(() => {
      const blocks = editor.topLevelBlocks;

      setPages(prev =>
        prev.map(p =>
          p.id === activeId ? { ...p, blocks } : p
        )
      );
    });

    return () => unsub && unsub();
  }, [editor, activeId, isLoading]);

  // -------- AUTO-SAVE TO JSON FILE --------
  useEffect(() => {
    if (!isLoading && pages.length > 0) {
      console.log("Saving pages", pages); // <--- add this
      saveDB(pages); // writes to JSON through IPC
    }
  }, [pages, isLoading]);

  // -------- ACTIONS ----------
  const addPage = () => {
    const id = uuid();
    const newPage: Page = {
      id,
      title: "Untitled",
      blocks: [{ type: "paragraph", content: "" }]
    };

    setPages(prev => [...prev, newPage]);
    setActiveId(id);
  };

  const setTitle = (title: string) => {
    setPages(prev =>
      prev.map(p => (p.id === activeId ? { ...p, title } : p))
    );
  };

  const deletePage = (id: string) => {
    if (pages.length <= 1) {
      alert("Cannot delete the last page");
      return;
    }

    const newPages = pages.filter(p => p.id !== id);
    setPages(newPages);

    if (activeId === id) {
      setActiveId(newPages[0].id);
    }
  };

  // -------- UI ----------
  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>O-Xilia</h2>
          <button onClick={addPage} className="new-page-btn">+ New Page</button>
        </div>

        <ul className="pages-list">
          {pages.map((page) => (
            <li
              key={page.id}
              className={`page-item ${page.id === activeId ? "active" : ""}`}
              onClick={() => setActiveId(page.id)}
            >
              <span>{page.title || "Untitled"}</span>
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
            <p>Select or create a page to begin.</p>
          </div>
        )}
      </main>
    </div>
  );
}
