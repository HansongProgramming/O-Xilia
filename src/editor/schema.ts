import { BlockNoteSchema } from "@blocknote/core";
import { createAlert } from "../components/customBlocks/warningBlock"; // adjust path

export const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    alert: createAlert(),
  },
});
