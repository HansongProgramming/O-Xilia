// src/hooks/useActions.ts
import { useEffect } from "react";
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
  /* ------------------------------------------------------------------ */
  /* Page + Category Actions                                             */
  /* ------------------------------------------------------------------ */

  const createPage = (categoryId: string, id?: string, title?: string) => {
    const newPage: Page = {
      id: id || uuid(),
      title: title || "Untitled",
      blocks: [{ type: "paragraph", content: "" }],
      categoryId,
      icon: "outline-insert-drive-file",
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
      icon: "outline-folder",
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

    if (totalPages <= 1) {
      alert("Cannot delete last page.");
      return;
    }

    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        pages: (c.pages || []).filter((p) => p.id !== pageId),
      }))
    );

    if (activePageId === pageId) {
      const remaining = categories
        .flatMap((c) => c.pages || [])
        .filter((p) => p.id !== pageId);

      if (remaining[0]) setActivePageId(remaining[0].id);
    }
  };

  const deleteCategory = (catId: string) => {
    setCategories((prev) => {
      if (prev.length <= 1) {
        alert("Cannot delete the last category");
        return prev;
      }

      const newCats = prev.filter((c) => c.id !== catId);

      const stillExists = newCats
        .flatMap((c) => c.pages || [])
        .some((p) => p.id === activePageId);

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
      categories.find((c) =>
        (c.pages || []).some((p) => p.id === activePageId)
      )?.id;

    if (!target) return alert("No category selected.");

    const folder = await chooseFolder();
    if (!folder) return;

    setCategories((prev) =>
      prev.map((c) => (c.id === target ? { ...c, folderPath: folder } : c))
    );
  };

  /* ------------------------------------------------------------------ */
  /* Icon Picker                                                         */
  /* ------------------------------------------------------------------ */

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

    setContextMenu((s) => ({
      ...s,
      visible: false,
      type: null,
      categoryId: null,
    }));
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

  /* ------------------------------------------------------------------ */
  /* FlowBlock Integration (FIXED)                                       */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const handleCreatePage = (
      e: CustomEvent<{ pageId: string; title: string }>
    ) => {
      const { pageId, title } = e.detail;

      // Check if page already exists
      const pageExists = categories.some((c) =>
        (c.pages || []).some((p) => p.id === pageId)
      );
      if (pageExists) return;

      // ✅ derive category from ACTIVE page
      const categoryId = categories.find((c) =>
        (c.pages || []).some((p) => p.id === activePageId)
      )?.id;

      if (!categoryId) {
        console.warn("FlowBlock: no category found for active page");
        return;
      }

      createPage(categoryId, pageId, title);
      setActivePageId(pageId);
    };

    const handleOpenPage = (e: CustomEvent<{ pageId: string }>) => {
      setActivePageId(e.detail.pageId);
    };

    const handleDeletePage = (e: CustomEvent<{ pageId: string }>) => {
      deletePage(e.detail.pageId);
    };

    window.addEventListener(
      "flow:create-page",
      handleCreatePage as EventListener
    );
    window.addEventListener(
      "flow:open-page",
      handleOpenPage as EventListener
    );
    window.addEventListener(
      "flow:delete-page",
      handleDeletePage as EventListener
    );

    return () => {
      window.removeEventListener(
        "flow:create-page",
        handleCreatePage as EventListener
      );
      window.removeEventListener(
        "flow:open-page",
        handleOpenPage as EventListener
      );
      window.removeEventListener(
        "flow:delete-page",
        handleDeletePage as EventListener
      );
    };
  }, [categories, activePageId]);

  /* ------------------------------------------------------------------ */
  /* Exposed API                                                         */
  /* ------------------------------------------------------------------ */

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
