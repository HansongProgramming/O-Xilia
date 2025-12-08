import { useEffect, useState, useMemo } from "react";
import { v4 as uuid } from "uuid";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteEditor } from "@blocknote/core";
import type { PartialBlock } from "@blocknote/core";
import { loadDB, saveDB } from "./lib/storage";
import type { Page } from "./types";

import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import "./index.css";

export default function App() {
  const [pages, setPages] = useState<Page[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [initialContent, setInitialContent] = useState<PartialBlock[] | "loading">("loading");
  const [isLoading, setIsLoading] = useState(true);

  // -------- LOAD PAGES ----------
  useEffect(() => {
    async function init() {
      try {
        const data = await loadDB();
        if (data && data.length > 0) {
          setPages(data);
          setActiveId(data[0].id);
          setInitialContent(data[0].blocks ?? [{ type: "paragraph", content: "" }]);
        } else {
          const initial: Page = {
            id: uuid(),
            title: "Welcome to O-Xilia",
            blocks: [{ type: "paragraph", content: "Start your first note..." }]
          };
          setPages([initial]);
          setActiveId(initial.id);
          setInitialContent(initial.blocks);
        }
      } catch (err) {
        console.error(err);
        const fallback: Page = { id: uuid(), title: "Untitled", blocks: [{ type: "paragraph", content: "" }] };
        setPages([fallback]);
        setActiveId(fallback.id);
        setInitialContent(fallback.blocks);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // -------- CREATE EDITOR ----------
  const editor = useMemo(() => {
    if (initialContent === "loading") return undefined;
    return BlockNoteEditor.create({ initialContent });
  }, [initialContent]);

  // -------- HANDLE BLOCKNOTE CHANGES ----------
  useEffect(() => {
    if (!editor) return;

    const unsub = editor.onChange(() => {
      const blocks = editor.document; // full content
      setPages(prev =>
        prev.map(p =>
          p.id === activeId ? { ...p, blocks } : p
        )
      );
    });

    return () => unsub && unsub();
  }, [editor, activeId]);

  // -------- AUTO-SAVE ----------
  useEffect(() => {
    if (!isLoading && pages.length > 0) {
      saveDB(pages);
    }
  }, [pages, isLoading]);

  // -------- ACTIONS ----------
  const activePage = useMemo(() => pages.find(p => p.id === activeId), [pages, activeId]);

  const addPage = () => {
    const id = uuid();
    const newPage: Page = { id, title: "Untitled", blocks: [{ type: "paragraph", content: "" }] };
    setPages(prev => [...prev, newPage]);
    setActiveId(id);
    setInitialContent(newPage.blocks);
  };

  const setTitle = (title: string) => {
    setPages(prev => prev.map(p => p.id === activeId ? { ...p, title } : p));
  };

  const deletePage = (id: string) => {
    if (pages.length <= 1) return alert("Cannot delete the last page");
    const newPages = pages.filter(p => p.id !== id);
    setPages(newPages);
    if (activeId === id) {
      setActiveId(newPages[0].id);
      setInitialContent(newPages[0].blocks);
    }
  };

  if (isLoading || !editor) return <div className="loading">Loading...</div>;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>O-Xilia</h2>
          <button onClick={addPage}>+ New Page</button>
        </div>
        <ul className="pages-list">
          {pages.map(page => (
            <li
              key={page.id}
              className={page.id === activeId ? "active" : ""}
              onClick={() => {
                setActiveId(page.id);
                setInitialContent(page.blocks);
              }}
            >
              <span>{page.title || "Untitled"}</span>
              <button onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}>×</button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="main-content">
        <input
          className="title-input"
          value={activePage?.title || ""}
          onChange={e => setTitle(e.target.value)}
          placeholder="Page title..."
        />
        <div className="editor-container">
          <BlockNoteView editor={editor} />
        </div>
      </main>
    </div>
  );
}
