// src/hooks/useEditor.ts
import { useEffect, useState } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import type { Category } from "../types";
import { schema } from "../editor/schema";

export function useEditor(
  categories: Category[],
  activePageId: string,
  isLoading: boolean
) {
  const [editor, setEditor] = useState<BlockNoteEditor<any, any, any>>(); // ← FIX

  useEffect(() => {
    if (isLoading) return;

    const activePage = categories
      .flatMap((c) => c.pages || [])
      .find((p) => p?.id === activePageId);

    if (!activePage) return;

    // --- Create editor if not exists ---
    if (!editor) {
      const e = BlockNoteEditor.create({
        schema,
        initialContent: activePage.blocks || [],
      });

      setEditor(e);
      return;
    }

    // --- Load page blocks into editor ---
    try {
      editor.replaceBlocks(editor.document, activePage.blocks || []);
    } catch (_) {}

  }, [activePageId, isLoading]);

  return editor;
}
