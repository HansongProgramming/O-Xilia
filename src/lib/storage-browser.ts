import type { Page } from "../types";

const KEY = "oxilia:pages";

export function loadDB(): Page[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDB(pages: Page[]) {
  localStorage.setItem(KEY, JSON.stringify(pages));
}