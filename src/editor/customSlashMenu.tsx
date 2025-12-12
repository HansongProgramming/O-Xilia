import { BlockNoteEditor } from "@blocknote/core";
import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import type { DefaultReactSuggestionItem } from "@blocknote/react";
import {getDefaultReactSlashMenuItems } from "@blocknote/react";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { createAlert } from "../components/customBlocks/warningBlock"; 

// --- Hello World block ---
export const insertHelloWorldItem = (editor: BlockNoteEditor) => ({
  title: "Insert Hello World",
  onItemClick: () =>
    insertOrUpdateBlockForSlashMenu(editor, {
      type: "paragraph",
      content: [{ type: "text", text: "Hello World", styles: { bold: true } }],
    }),
  aliases: ["helloworld", "hw"],
  group: "Other",
  icon: <HiOutlineGlobeAlt size={18} />,
  subtext: "Insert a block with 'Hello World'.",
});

// --- Alert block ---
export const insertAlertBlockItem = (editor: BlockNoteEditor) => ({
  title: "Insert Alert Block",
  onItemClick: () =>
    insertOrUpdateBlockForSlashMenu(editor, {
      type: "alert" as any, // cast if using a custom block type
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
  insertHelloWorldItem(editor),
  insertAlertBlockItem(editor),
];
