import React, { useEffect, useRef } from "react";
import { BlockNoteView } from "@blocknote/mantine";

export default function EditorPane({ noteId }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!noteId || !window.oXiliaAPI?.loadNote) return;

    async function load() {
      const note = await window.oXiliaAPI.loadNote(noteId);
      if (editorRef.current) {
        editorRef.current.setContent(note?.content || [{ type: "paragraph", content: "" }]);
      }
    }
    load();
  }, [noteId]);

  async function save() {
    if (editorRef.current) {
      const content = editorRef.current.getContent();
      await window.oXiliaAPI.saveNote({ id: noteId, content });
    }
  }

  return <BlockNoteView ref={editorRef} />;
}
