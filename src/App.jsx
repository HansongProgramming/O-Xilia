import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import EditorPane from './components/EditorPane';
import './styles.css';

export default function App() {
  const [activeNote, setActiveNote] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefreshList = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="app">
      <Sidebar 
        key={refreshKey}
        onOpenNote={setActiveNote} 
      />
      <div className="main-content">
        {activeNote ? (
          <EditorPane 
            noteId={activeNote} 
            onRefreshList={handleRefreshList}
          />
        ) : (
          <div className="welcome-message">
            <h1>Welcome to O-Xilia</h1>
            <p>Open or create a note to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}