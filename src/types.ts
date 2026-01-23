export type PageType = "note" | "channel";

export type Page = {
  id: string;
  title: string;
  icon?: string;
  blocks: any[];
  categoryId: string;
  type: PageType;
  parentId: string | null;
  children?: Page[];
  isExpanded?: boolean; // NEW: Track if page's children are visible
};

export type Category = {
  id: string;
  name: string;
  icon?: string;      
  isExpanded: boolean;
  pages: Page[];
  folderPath?: string;
};

export type ContextMenuState = {
  visible: boolean;
  x: number;
  y: number;
  type: "category" | "sidebar" | "page" | null; // NEW: Added "page" type
  categoryId: string | null;
  pageId?: string | null; // NEW: Track which page was right-clicked
};

export type IconPickerState = {
  visible: boolean;
  x: number;
  y: number;
  forType: "category" | "page" | null;
  id: string | null;
};