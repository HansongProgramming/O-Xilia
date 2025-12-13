import { useEffect, useState } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import type { Category } from "../types";
import { schema } from "../editor/schema";

function sanitizeBlocks(blocks: any[]) {
  if (!Array.isArray(blocks)) return [];

  return blocks
    .filter((block) =>
      ["paragraph", "alert", "whiteboard", "flow"].includes(block?.type)
    )
    .map((block) => {
      if (block.type === "flow") {
        return {
          ...block,
          props: {
            flow:
              block.props?.flow ??
              JSON.stringify({ nodes: [], edges: [] }),
          },
        };
      }
      return block;
    });
}

export function useEditor(
  categories: Category[],
  activePageId: string,
  isLoading: boolean
) {
  const [editor, setEditor] =
    useState<BlockNoteEditor<any, any, any>>();

  useEffect(() => {
    if (isLoading) return;

    const activePage = categories
      .flatMap((c) => c.pages || [])
      .find((p) => p?.id === activePageId);

    if (!activePage) return;

    const safeBlocks = sanitizeBlocks(activePage.blocks);

    if (!editor) {
      const e = BlockNoteEditor.create({
        schema,
        initialContent: safeBlocks,
      });

      setEditor(e);
      return;
    }

    try {
      editor.replaceBlocks(editor.document, safeBlocks);
    } catch (err) {
      console.error("Failed to replace blocks:", err);
    }
  }, [activePageId, isLoading]);

  return editor;
}
