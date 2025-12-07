import { useEffect, useMemo, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";

const STORAGE_KEY = "oxilia:page";

function App() {
const editor = useCreateBlockNote();

return (
    <div className="app">
    <BlockNoteView editor={editor} />
    </div>
);
}
export default App;