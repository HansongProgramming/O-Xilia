import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import EditorPane from "./components/EditorPane";

export default function App() {
  const [activeNote, setActiveNote] = useState(null);
  const refreshList = () => {}; // you can implement via events or state lifting

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar onOpenNote={(id) => setActiveNote(id)} />
      <div style={{ flex: 1 }}>
        {activeNote ? (
          <EditorPane noteId={activeNote} onSaveSignal={refreshList} />
        ) : (
          <div style={{ padding: 20 }}>Open or create a note</div>
        )}
      </div>
    </div>
  );
}
