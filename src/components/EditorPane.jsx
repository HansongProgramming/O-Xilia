import React, { useEffect, useState } from 'react';
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";

export default function EditorPane({ noteId, onRefreshList }) {
  const [initialContent, setInitialContent] = useState(null);
  const [editor, setEditor] = useState(null);

  // Create editor instance
  const blockNoteEditor = useCreateBlockNote({
    initialContent: initialContent || [{ type: "paragraph", content: "" }],
  });

  useEffect(() => {
    if (blockNoteEditor) {
      setEditor(blockNoteEditor);
    }
  }, [blockNoteEditor]);

  useEffect(() => {
    if (!noteId || !window.oXiliaAPI?.loadNote) return;

    async function load() {
      try {
        const note = await window.oXiliaAPI.loadNote(noteId);
        if (note?.content) {
          setInitialContent(note.content);
        } else {
          setInitialContent([{ type: "paragraph", content: "" }]);
        }
      } catch (error) {
        console.error("Failed to load note:", error);
        setInitialContent([{ type: "paragraph", content: "" }]);
      }
    }
    
    load();
  }, [noteId]);

  const handleSave = async () => {
    if (!editor || !noteId) return;

    try {
      const content = editor.getJSON();
      await window.oXiliaAPI.saveNote({ id: noteId, content });
      
      // Show success feedback
      if (window.oXiliaAPI?.alert) {
        window.oXiliaAPI.alert("Note saved successfully!");
      }
      
      onRefreshList();
    } catch (error) {
      console.error("Failed to save note:", error);
      if (window.oXiliaAPI?.alert) {
        window.oXiliaAPI.alert("Failed to save note: " + error.message);
      }
    }
  };

  if (!noteId) return null;

  return (
    <div className="editor-pane">
      <div className="editor-header">
        <h3>Editing: {noteId}</h3>
        <button onClick={handleSave} className="save-button">
          Save Note
        </button>
      </div>
      
      <div className="editor-container">
        <BlockNoteView
          editor={blockNoteEditor}
          onChange={() => {
            // Auto-save on change (optional)
            // handleSave();
          }}
        />
      </div>
    </div>
  );
}