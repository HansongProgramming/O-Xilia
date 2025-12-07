import React, { useEffect, useState } from "react";

export default function Sidebar({ onOpenNote }) {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    async function fetchNotes() {
      if (!window.oXiliaAPI?.listNotes) return console.error("oXiliaAPI not available");
      const list = await window.oXiliaAPI.listNotes();
      setNotes(list);
    }
    fetchNotes();
  }, []);

  async function createNew() {
    const id = `note-${Date.now()}`;
    const empty = [{ type: "paragraph", content: "" }];
    await window.oXiliaAPI.createNote({ id, content: empty });
    setNotes((s) => [{ id, file: `${id}.json`, mtime: Date.now() }, ...s]);
    onOpenNote(id);
  }

  async function remove(id) {
    await window.oXiliaAPI.deleteNote(id);
    setNotes((s) => s.filter((n) => n.id !== id));
  }

  return (
    <div style={{ width: 260, borderRight: "1px solid #eee", padding: 8 }}>
      <button onClick={createNew}>+ New</button>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {notes.map((n) => (
          <li key={n.id} style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => onOpenNote(n.id)}>{n.id}</button>
            <button onClick={() => remove(n.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
