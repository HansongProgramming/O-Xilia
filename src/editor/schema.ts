import { BlockNoteSchema } from "@blocknote/core";
import { createAlert } from "../components/customBlocks/warningBlock"; 
import { whiteboardBlock  } from "../components/customBlocks/canvas"; 
import { flowBlock } from "../components/customBlocks/FlowBlock"; 

export const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    alert: createAlert(),
     whiteboard: whiteboardBlock(),
     flow: flowBlock(), 
  },
});
