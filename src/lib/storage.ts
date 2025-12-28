import type { Category } from "../types";

type AppData = {
  categories: Category[];
};

const isElectron = !!(window as any).storage;

/**
 * Ensure every page has parentId (for nesting support)
 */
function normalizePages(pages: any[]) {
  return pages.map((page) => ({
    ...page,
    parentId: page.parentId ?? null,
  }));
}

/**
 * Normalize categories + pages together
 */
function normalizeCategories(categories: Category[]): Category[] {
  return categories.map((cat) => ({
    ...cat,
    isExpanded: cat.isExpanded ?? true,
    pages: normalizePages(cat.pages ?? []),
  }));
}

export async function chooseFolder(): Promise<string | null> {
  if (!isElectron) return null;
  return await (window as any).storage.chooseFolder();
}

export async function loadDB(): Promise<Category[]> {
  try {
    /* =======================
       ELECTRON STORAGE
       ======================= */
    if (isElectron) {
      const data = await (window as any).storage.load();

      // New format: { categories }
      if (data && data.categories) {
        return normalizeCategories(data.categories);
      }

      // Old format: Page[]
      if (Array.isArray(data)) {
        const defaultCategory: Category = {
          id: "default-category",
          name: "Default",
          isExpanded: true,
          pages: normalizePages(
            data.map((page: any) => ({
              ...page,
              categoryId: "default-category",
            }))
          ),
        };

        return [defaultCategory];
      }

      return [];
    }

    /* =======================
       BROWSER STORAGE
       ======================= */
    const raw = localStorage.getItem("oxilia:categories");
    if (raw) {
      const parsed = JSON.parse(raw);

      // { categories }
      if (parsed.categories) {
        return normalizeCategories(parsed.categories);
      }

      // categories[]
      if (Array.isArray(parsed)) {
        return normalizeCategories(parsed);
      }
    }

    /* =======================
       LEGACY PAGES STORAGE
       ======================= */
    const oldRaw = localStorage.getItem("oxilia:pages");
    if (oldRaw) {
      const oldPages = JSON.parse(oldRaw);

      const defaultCategory: Category = {
        id: "default-category",
        name: "Default",
        isExpanded: true,
        pages: normalizePages(
          oldPages.map((page: any) => ({
            ...page,
            categoryId: "default-category",
          }))
        ),
      };

      return [defaultCategory];
    }

    return [];
  } catch (error) {
    console.error("Error loading data:", error);
    return [];
  }
}

export async function saveDB(categories: Category[]): Promise<void> {
  try {
    const data: AppData = {
      categories: normalizeCategories(categories),
    };

    if (isElectron) {
      await (window as any).storage.save(data);
    } else {
      localStorage.setItem("oxilia:categories", JSON.stringify(data));
    }
  } catch (error) {
    console.error("Error saving data:", error);
  }
}
