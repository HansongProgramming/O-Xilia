import { useEffect } from "react";
import type { BlockNoteEditor } from "@blocknote/core";
import type { Category } from "../types";
import type React from "react";

export function useEditorChange(
  editor: BlockNoteEditor | undefined,
  categories: Category[],
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>,
  activePageId: string,
  isLoading: boolean
) {
  useEffect(() => {
    if (!editor || isLoading) return;

    const unsub = editor.onChange(() => {
      const blocks = editor.document;

      setCategories(prev =>
        prev.map(cat => ({
          ...cat,
          pages: (cat.pages || []).map(page =>
            page && page.id === activePageId ? { ...page, blocks } : page
          )
        }))
      );
    });

    return () => unsub && unsub();
  }, [editor, categories, setCategories, activePageId, isLoading]);
}
