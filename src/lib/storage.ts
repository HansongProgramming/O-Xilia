// src/lib/storage.ts
import type { Category } from "../types";

type AppData = {
  categories: Category[];
};

const isElectron = !!(window as any).storage;

export async function chooseFolder(): Promise<string | null> {
  if (!isElectron) return null;
  return await (window as any).storage.chooseFolder();
}

export async function loadDB(): Promise<Category[]> {
  try {
    if (isElectron) {
      const data = await (window as any).storage.load();
      // Handle both old format (pages array) and new format (categories)
      if (data && data.categories) {
        return data.categories;
      } else if (data && Array.isArray(data)) {
        // Convert old page format to new category format
        const defaultCategory: Category = {
          id: "default-category",
          name: "Default",
          isExpanded: true,
          pages: data.map(page => ({
            ...page,
            categoryId: "default-category"
          }))
        };
        return [defaultCategory];
      }
      return [];
    }
    
    // Browser fallback
    const raw = localStorage.getItem("oxilia:categories");
    if (raw) {
      const data = JSON.parse(raw);
      return data.categories || data || [];
    }
    
    // Check for old format in localStorage
    const oldRaw = localStorage.getItem("oxilia:pages");
    if (oldRaw) {
      const oldPages = JSON.parse(oldRaw);
      const defaultCategory: Category = {
        id: "default-category",
        name: "Default",
        isExpanded: true,
        pages: oldPages.map((page: any) => ({
          ...page,
          categoryId: "default-category"
        }))
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
    const data: AppData = { categories };
    
    if (isElectron) {
      await (window as any).storage.save(data);
    } else {
      localStorage.setItem("oxilia:categories", JSON.stringify(data));
    }
  } catch (error) {
    console.error("Error saving data:", error);
  }
}