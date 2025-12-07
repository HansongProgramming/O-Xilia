import { useEffect, useState } from "react";
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
  const [activeId, setActiveId] = useState<string>("");

  // 1. load once
  useEffect(() => {
    const data = loadDB();
    setPages(data);
    setActiveId(data[0]?.id ?? uuid()); // pick first or create blank
  }, []);

  // 2. derive current page
  const activePage = pages.find((p) => p.id === activeId);
const editor = useCreateBlockNote(
  activePage?.blocks?.length ? { initialContent: activePage.blocks } : undefined
);

  // 3. auto-save blocks while typing
  useEffect(() => {
    if (!activeId) return;
    editor.onEditorContentChange(() => {
      setPages((prev) =>
        prev.map((p) =>
          p.id === activeId ? { ...p, blocks: editor.topLevelBlocks } : p
        )
      );
    });
  }, [activeId, editor]);

  // 4. persist whole db whenever pages change
  useEffect(() => {
    if (pages.length) saveDB(pages);
  }, [pages]);

  // 5. helpers
  const addPage = () => {
    const id = uuid();
    setPages((p) => [...p, { id, title: "Untitled", blocks: [] }]);
    setActiveId(id);
  };

  const setTitle = (title: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === activeId ? { ...p, title } : p))
    );
  };

  return (
    <div className="layout">
      <aside>
        <button onClick={addPage}>+ New page</button>
        <ul>
          {pages.map((p) => (
            <li
              key={p.id}
              className={p.id === activeId ? "active" : ""}
              onClick={() => setActiveId(p.id)}
            >
              {p.title || "Untitled"}
            </li>
          ))}
        </ul>
      </aside>

      <main>
        <input
          className="title-input"
          value={activePage?.title || ""}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
        />
        <BlockNoteView editor={editor} />
      </main>
    </div>
  );
}