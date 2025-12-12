import { BlockNoteSchema } from "@blocknote/core";
import { createAlert } from "../components/customBlocks/warningBlock"; 
import { whiteboardBlock  } from "../components/customBlocks/canvas"; // adjust path


export const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    alert: createAlert(),
     whiteboard: whiteboardBlock(),
  },
});
