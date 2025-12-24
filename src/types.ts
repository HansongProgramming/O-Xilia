export type PageType = "note" | "channel";

export type Page = {
  id: string;
  title: string;
  icon?: string;
  blocks: any[];
  categoryId: string;
    type: PageType;
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
  type: "category" | "sidebar" | null;
  categoryId: string | null;
};

export type IconPickerState = {
  visible: boolean;
  x: number;
  y: number;
  forType: "category" | "page" | null;
  id: string | null;
};
