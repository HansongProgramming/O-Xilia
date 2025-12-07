import type { PartialBlock } from "@blocknote/core";

export interface Page {
  id: string;
  title: string;
  blocks: PartialBlock[];   // <-- safe public shape
}