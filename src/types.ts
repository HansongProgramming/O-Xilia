// types.ts
import type { PartialBlock } from "@blocknote/core";

export type Page = {
  id: string;
  title: string;
  icon?: string;      // new
  blocks: any[];
  categoryId: string;
};

export type Category = {
  id: string;
  name: string;
  icon?: string;      // new
  isExpanded: boolean;
  pages: Page[];
  folderPath?: string;
};