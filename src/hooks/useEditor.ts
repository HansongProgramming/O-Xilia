// src/hooks/useEditor.ts
import { useEffect, useState } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import type { Category } from "../types";

export function useEditor(categories: Category[], activePageId: string, isLoading: boolean) {
  const [editor, setEditor] = useState<BlockNoteEditor>();

  useEffect(() => {
    if (isLoading) return;

    const activePage = categories
      .flatMap((c) => c.pages || [])
      .find((p) => p?.id === activePageId);

    if (!activePage) return;

    if (!editor) {
      const e = BlockNoteEditor.create({
        initialContent: activePage.blocks || [],
      });
      setEditor(e);
    } else {
      try {
        editor.replaceBlocks(editor.document, activePage.blocks || []);
      } catch {}
    }
  }, [activePageId, isLoading]);

  return editor;
}
