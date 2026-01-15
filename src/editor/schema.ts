import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { createAlert } from "../components/customBlocks/warningBlock"; 
import { whiteboardBlock } from "../components/customBlocks/canvas"; 
import { flowBlock } from "../components/customBlocks/FlowBlock"; 
import { ganttBlock } from "../components/customBlocks/ganttblock"; 

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    alert: createAlert(),
    whiteboard: whiteboardBlock(),
    flow: flowBlock(),
    gantt: ganttBlock(),
  },
});