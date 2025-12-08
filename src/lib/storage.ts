import type { Page } from "../types";

const isElectron = !!(window as any).storage;

// Load all pages from JSON
export async function loadDB(): Promise<Page[]> {
  if (isElectron) {
    return await (window as any).storage.load() ?? [];
  }

  try {
    const raw = localStorage.getItem("oxilia:pages");
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load pages:", err);
    return [];
  }
}

// Save all pages to JSON
export async function saveDB(pages: Page[]): Promise<void> {
  if (isElectron) {
    await (window as any).storage.save(pages);
    return;
  }

  try {
    localStorage.setItem("oxilia:pages", JSON.stringify(pages));
  } catch (err) {
    console.error("Failed to save pages:", err);
  }
}
