import type { Page } from "../types";

const isElectron = !!(window as any).storage;

export async function chooseFolder(): Promise<string | null> {
  if (!isElectron) return null;
  return await (window as any).storage.chooseFolder();
}

export async function loadDB(): Promise<Page[]> {
  if (isElectron) return await (window as any).storage.load();
  const raw = localStorage.getItem("oxilia:pages");
  return raw ? JSON.parse(raw) : [];
}

export async function saveDB(pages: Page[]): Promise<void> {
  if (isElectron) return await (window as any).storage.save(pages);
  localStorage.setItem("oxilia:pages", JSON.stringify(pages));
}
