import { BlockNoteSchema } from "@blocknote/core";
import { createAlert } from "../components/customBlocks/warningBlock"; 
import { whiteboardBlock  } from "../components/customBlocks/canvas"; 
import { nodeGraphBlock } from "../components/customBlocks/nodeGraphBlock"; 

export const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    alert: createAlert(),
     whiteboard: whiteboardBlock(),
     "node-graph": nodeGraphBlock(), 
  },
});
