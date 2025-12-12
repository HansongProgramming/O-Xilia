import { BlockNoteEditor } from "@blocknote/core";
import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import type { DefaultReactSuggestionItem } from "@blocknote/react";
import {getDefaultReactSlashMenuItems } from "@blocknote/react";
import { HiOutlineGlobeAlt } from "react-icons/hi";


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

// --- Combined default + custom items ---
export const getCustomSlashMenuItems = (editor: BlockNoteEditor): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor), // include default items
  insertAlertBlockItem(editor),
];
