import { useEffect, useState } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import type { Category } from "../types";
import { schema } from "../editor/schema";

function sanitizeBlocks(blocks: any[]) {
  if (!Array.isArray(blocks)) return [];

  return blocks.map((block) => {
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

  // Create editor only once
  useEffect(() => {
    if (isLoading) return;

    const e = BlockNoteEditor.create({
      schema,
      initialContent: [
        {
          type: "paragraph",
          content: "",
        },
      ],
      defaultStyles: true,
      trailingBlock: false,
    });

    setEditor(e);

    // Cleanup: destroy editor on unmount
    return () => {
      e._tiptapEditor.destroy();
    };
  }, [isLoading]); // Added isLoading to deps

  // Update content when page changes
  useEffect(() => {
    if (isLoading || !editor) return;

    const activePage = categories
      .flatMap((c) => c.pages || [])
      .find((p) => p?.id === activePageId);

    if (!activePage) return;

    const safeBlocks = sanitizeBlocks(activePage.blocks);
    
    // Ensure we always have at least one block
    const blocksToReplace = safeBlocks.length > 0 
      ? safeBlocks 
      : [{ type: "paragraph", content: "" }];

    try {
      editor.replaceBlocks(editor.document, blocksToReplace);
    } catch (err) {
      console.error("Failed to replace blocks:", err);
    }
  }, [activePageId, categories, editor, isLoading]);

  return editor;
}