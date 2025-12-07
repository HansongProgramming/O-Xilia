import React, { useEffect, useState } from "react";

export default function Sidebar({ onOpenNote }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      if (!window.oXiliaAPI?.listNotes) {
        console.error("oXiliaAPI not available");
        setLoading(false);
        return;
      }
      
      const list = await window.oXiliaAPI.listNotes();
      setNotes(list);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      setLoading(false);
    }
  };

  const createNew = async () => {
    try {
      const id = `note-${Date.now()}`;
      const emptyContent = [{ type: "paragraph", content: "" }];
      
      await window.oXiliaAPI.createNote({ id, content: emptyContent });
      
      setNotes(prev => [{ id, file: `${id}.json`, mtime: Date.now() }, ...prev]);
      onOpenNote(id);
    } catch (error) {
      console.error("Failed to create note:", error);
      if (window.oXiliaAPI?.alert) {
        window.oXiliaAPI.alert("Failed to create note: " + error.message);
      }
    }
  };

  const remove = async (id) => {
    try {
      await window.oXiliaAPI.deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      
      // If we're deleting the active note, clear the editor
      // This would need to be handled by the parent component
    } catch (error) {
      console.error("Failed to delete note:", error);
      if (window.oXiliaAPI?.alert) {
        window.oXiliaAPI.alert("Failed to delete note: " + error.message);
      }
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="sidebar">
        <h2>Notes</h2>
        <div className="loading">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Notes</h2>
        <button onClick={createNew} className="new-note-button">
          + New Note
        </button>
      </div>
      
      <div className="notes-list">
        {notes.length === 0 ? (
          <div className="no-notes">
            <p>No notes yet</p>
            <button onClick={createNew} className="create-first-note">
              Create your first note
            </button>
          </div>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="note-item">
              <div 
                className="note-info" 
                onClick={() => onOpenNote(n.id)}
              >
                <div className="note-title">{n.id}</div>
                <div className="note-date">{formatDate(n.mtime)}</div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  remove(n.id);
                }} 
                className="delete-button"
                title="Delete note"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}