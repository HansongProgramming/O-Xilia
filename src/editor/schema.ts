import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { createAlert } from "../components/customBlocks/warningBlock"; 
import { whiteboardBlock } from "../components/customBlocks/canvas"; 
import { flowBlock } from "../components/customBlocks/FlowBlock"; 
import { ganttBlock } from "../components/customBlocks/ganttblock"; 

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    // Include all default blocks (paragraph, heading, code, etc.)
    ...defaultBlockSpecs,
    // Add your custom blocks
    alert: createAlert(),
    whiteboard: whiteboardBlock(),
    flow: flowBlock(),
    gantt: ganttBlock(),
  },
});