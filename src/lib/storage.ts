import type { Page } from "../types";

const KEY = "oxilia:pages";

export function loadDB(): Page[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Validate data structure
      if (Array.isArray(data)) {
        return data.filter(page => 
          page && 
          typeof page.id === 'string' && 
          typeof page.title === 'string' && 
          Array.isArray(page.blocks)
        );
      }
    }
    return [];
  } catch (error) {
    console.error("Failed to load data from localStorage:", error);
    return [];
  }
}

export function saveDB(pages: Page[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(pages));
  } catch (error) {
    console.error("Failed to save data to localStorage:", error);
    // Handle quota exceeded or other storage errors
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      alert("Storage quota exceeded. Please delete some pages to save new content.");
    }
  }
}

