import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import type { DefaultReactSuggestionItem } from "@blocknote/react";
import { getDefaultReactSlashMenuItems } from "@blocknote/react";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { MdOutlineDraw } from "react-icons/md";
import { TbRoute } from "react-icons/tb";

/* --------------------------------------------------------------- */
/* whiteboard slash item                                           */
/* --------------------------------------------------------------- */
export const insertWhiteboardBlockItem = (editor: any) => ({
  title: "Whiteboard",
  onItemClick: () =>
    insertOrUpdateBlockForSlashMenu(editor, {
      type: "whiteboard" as any,
      props: { strokes: "[]" },
    } as any),
  aliases: ["whiteboard", "draw", "sketch", "canvas"],
  group: "Media",
  icon: <MdOutlineDraw size={18} />,
  subtext: "Insert a drawing canvas.",
});

/* --------------------------------------------------------------- */
/* alert block item (your existing one)                            */
/* --------------------------------------------------------------- */
export const insertAlertBlockItem = (editor: any) => ({
  title: "Insert Alert Block",
  onItemClick: () =>
    insertOrUpdateBlockForSlashMenu(editor, {
      type: "alert" as any,
      content: [],
    } as any),
  aliases: ["alert", "warning", "info", "error", "success"],
  group: "Alerts",
  icon: <HiOutlineGlobeAlt size={18} />,
  subtext: "Insert a customizable alert block.",
});

export const insertFlowBlockItem = (editor: any) => ({
  title: "Flow diagram",
  onItemClick: () =>
    insertOrUpdateBlockForSlashMenu(editor, {
      type: "flow" as any,
      props: { flow: JSON.stringify({ nodes: [], edges: [] }) },
    } as any),
  aliases: ["flow", "diagram", "nodes", "react-flow"],
  group: "Media",
  icon: <TbRoute size={18} />,
  subtext: "Insert an interactive React-Flow canvas.",
});

/* --------------------------------------------------------------- */
/* combined list                                                   */
/* --------------------------------------------------------------- */
export const getCustomSlashMenuItems = (
  editor: any
): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor),
  insertAlertBlockItem(editor),
  insertWhiteboardBlockItem(editor),
  insertFlowBlockItem(editor),   
];