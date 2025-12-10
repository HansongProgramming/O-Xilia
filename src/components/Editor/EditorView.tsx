import React, { useEffect } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import type { BlockNoteEditor } from "@blocknote/core";
import type { Page } from "../../types";


type Props = {
    editorRef: React.RefObject<BlockNoteEditor | null>;
    activePage?: Page | null;
};


export function EditorView({ editorRef, activePage }: Props) {
    // The editorRef is controlled by App. We only render the view.
    useEffect(() => {
        // no-op: editor lifecycle handled in App
    }, [activePage]);


    if (!activePage || !editorRef.current) {
        return (
            <div className="no-page-selected">
                <h3>No page selected</h3>
                <p>Create a new page or select an existing one to get started</p>
            </div>
        );
    }


    return (
        <>
            <div className="editor-container">
                <BlockNoteView editor={editorRef.current} />
            </div>
        </>
    );
}