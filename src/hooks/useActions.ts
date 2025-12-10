// src/hooks/useActions.ts
import { v4 as uuid } from "uuid";
import { chooseFolder } from "../lib/storage";
import type {
  Category,
  Page,
  IconPickerState,
  ContextMenuState,
} from "../types";

export function useActions(
  categories: Category[],
  setCategories: (cb: (prev: Category[]) => Category[]) => void,
  activePageId: string,
  setActivePageId: (id: string) => void,
  setContextMenu: (cb: (s: ContextMenuState) => ContextMenuState) => void,
  iconPicker: IconPickerState,
  setIconPicker: (s: IconPickerState) => void
) {
  const createPage = (categoryId: string) => {
    const newPage: Page = {
      id: uuid(),
      title: "Untitled",
      blocks: [{ type: "paragraph", content: "" }],
      categoryId,
      icon: "ic:outline-insert-drive-file", // <-- default Iconify icon
    };

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, pages: [...(cat.pages || []), newPage] }
          : cat
      )
    );

    setActivePageId(newPage.id);
  };

  const createCategory = () => {
    const c: Category = {
      id: uuid(),
      name: "New Category",
      icon: "folder", // <-- default Iconify icon
      isExpanded: true,
      pages: [],
    };

    setCategories((prev) => [...prev, c]);
  };

  const updatePageTitle = (title: string) => {
    if (!activePageId) return;

    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        pages: (cat.pages || []).map((p) =>
          p.id === activePageId ? { ...p, title } : p
        ),
      }))
    );
  };

  const deletePage = (pageId: string) => {
    const totalPages = categories.reduce(
      (sum, c) => sum + (c.pages?.length || 0),
      0
    );
    if (totalPages <= 1) return alert("Cannot delete last page.");

    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        pages: (c.pages || []).filter((p) => p.id !== pageId),
      }))
    );

    if (activePageId === pageId) {
      const all = categories
        .flatMap((c) => c.pages || [])
        .filter((p) => p.id !== pageId);

      if (all[0]) setActivePageId(all[0].id);
    }
  };

  const deleteCategory = (catId: string) => {
    setCategories(prev => {
      if ((prev || []).length <= 1) {
        alert("Cannot delete the last category");
        return prev;
      }

      const newCats = (prev || []).filter(c => c.id !== catId);

      const stillExists = newCats.flatMap(c => c.pages || []).find(p => p.id === activePageId);
      if (!stillExists) {
        const fallback = newCats[0]?.pages?.[0];
        if (fallback) setActivePageId(fallback.id);
        else setActivePageId("");
      }

      return newCats;
    });
  };

  const updateCategoryName = (categoryId: string, name: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, name } : c))
    );
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId ? { ...c, isExpanded: !c.isExpanded } : c
      )
    );
  };

  const setCategoryFolder = async (categoryId?: string) => {
    const target =
      categoryId ||
      categories.find((c) => (c.pages || []).some((p) => p.id === activePageId))
        ?.id;

    if (!target) return alert("No category selected.");

    const folder = await chooseFolder();
    if (!folder) return;

    setCategories((prev) =>
      prev.map((c) => (c.id === target ? { ...c, folderPath: folder } : c))
    );
  };

  const openIconPicker = (
    ev: React.MouseEvent,
    forType: "category" | "page",
    id: string
  ) => {
    ev.stopPropagation();

    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();

    setIconPicker({
      visible: true,
      x: rect.left,
      y: rect.bottom + 6,
      forType,
      id,
    });

    setContextMenu((s) => ({ ...s, visible: false, type: null, categoryId: null }));
  };

  const onIconSelect = (iconName: string) => {
    if (!iconPicker.forType || !iconPicker.id) return;

    if (iconPicker.forType === "category") {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === iconPicker.id ? { ...c, icon: iconName } : c
        )
      );
    }

    if (iconPicker.forType === "page") {
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          pages: (c.pages || []).map((p) =>
            p.id === iconPicker.id ? { ...p, icon: iconName } : p
          ),
        }))
      );
    }

    setIconPicker({
      visible: false,
      x: 0,
      y: 0,
      id: null,
      forType: null,
    });
  };

  return {
    createPage,
    updatePageTitle,
    deletePage,
    createCategory,
    deleteCategory,
    updateCategoryName,
    toggleCategoryExpanded,
    setCategoryFolder,
    openIconPicker,
    onIconSelect,
  };
}
