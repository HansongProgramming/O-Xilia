import { BlockNoteEditor } from "@blocknote/core";
import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import type { DefaultReactSuggestionItem } from "@blocknote/react";
import { getDefaultReactSlashMenuItems } from "@blocknote/react";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { MdOutlineDraw } from "react-icons/md"; 

/* --------------------------------------------------------------- */
/* whiteboard slash item                                           */
/* --------------------------------------------------------------- */
export const insertWhiteboardBlockItem = (editor: BlockNoteEditor) => ({
  title: "Whiteboard",
  onItemClick: () =>
    insertOrUpdateBlockForSlashMenu(editor, {
      type: "whiteboard" as any,
      props: { strokes: "[]" },
    }),
  aliases: ["whiteboard", "draw", "sketch", "canvas"],
  group: "Media",
  icon: <MdOutlineDraw size={18} />,
  subtext: "Insert a drawing canvas.",
});

/* --------------------------------------------------------------- */
/* alert block item (your existing one)                            */
/* --------------------------------------------------------------- */
export const insertAlertBlockItem = (editor: BlockNoteEditor) => ({
  title: "Insert Alert Block",
  onItemClick: () =>
    insertOrUpdateBlockForSlashMenu(editor, {
      type: "alert" as any,
      content: [],
    }),
  aliases: ["alert", "warning", "info", "error", "success"],
  group: "Alerts",
  icon: <HiOutlineGlobeAlt size={18} />,
  subtext: "Insert a customizable alert block.",
});

export const insertGraphBlockItem = (editor: BlockNoteEditor) => ({
  title: "Insert Pipeline Block",
  onItemClick: () =>
    insertOrUpdateBlockForSlashMenu(editor, {
      type: "node-graph" as any,
      props: {
        nodes: "[]",
        connections: "[]"
      }
    }),
  aliases: ["pipeline", "graph", "flow", "node"],
  group: "Media",
  icon: <MdOutlineDraw size={18} />,
  subtext: "Insert a node-connection block.",
});


/* --------------------------------------------------------------- */
/* combined list                                                   */
/* --------------------------------------------------------------- */
export const getCustomSlashMenuItems = (
  editor: BlockNoteEditor
): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor),
  insertAlertBlockItem(editor),
  insertWhiteboardBlockItem(editor),
  insertGraphBlockItem(editor),
];