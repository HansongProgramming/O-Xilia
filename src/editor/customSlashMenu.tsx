import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import type { DefaultReactSuggestionItem } from "@blocknote/react";
import { getDefaultReactSlashMenuItems } from "@blocknote/react";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { MdOutlineDraw, MdTimeline } from "react-icons/md";
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
/* alert block item                                                */
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

/* --------------------------------------------------------------- */
/* flow block item                                                 */
/* --------------------------------------------------------------- */
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
/* gantt chart block item                                          */
/* --------------------------------------------------------------- */
export const insertGanttBlockItem = (editor: any) => ({
  title: "Gantt Chart",
  onItemClick: () =>
    insertOrUpdateBlockForSlashMenu(editor, {
      type: "gantt" as any,
      props: {
        data: JSON.stringify({
          tasks: [
            {
              id: "1",
              name: "Task 1",
              start: new Date().toISOString().split("T")[0],
              end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
              color: "#507aff",
            },
          ],
        }),
      },
    } as any),
  aliases: ["gantt", "timeline", "project", "schedule", "chart"],
  group: "Media",
  icon: <MdTimeline size={18} />,
  subtext: "Insert a project timeline Gantt chart.",
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
  insertGanttBlockItem(editor),
];