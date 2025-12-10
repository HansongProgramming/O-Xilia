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