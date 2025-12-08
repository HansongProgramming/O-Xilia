// types.ts
import type { PartialBlock } from "@blocknote/core";

export interface Category {
  id: string;
  name: string;
  folderPath?: string; // Optional folder path for saving pages/blocks
  isExpanded: boolean;
  pages: Page[];
}

export interface Page {
  id: string;
  title: string;
  blocks: PartialBlock[];
  categoryId: string; // Reference to parent category
}