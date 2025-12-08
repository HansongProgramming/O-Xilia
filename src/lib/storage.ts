import type { Page } from "../types";

export async function loadDB(): Promise<Page[]> {
  if ((window as any).storage) {
    return await (window as any).storage.load();
  }

  const raw = localStorage.getItem("oxilia:pages");
  return raw ? JSON.parse(raw) : [];
}

export async function saveDB(pages: Page[]): Promise<void> {
  if ((window as any).storage) {
    await (window as any).storage.save(pages);
    return;
  }

  localStorage.setItem("oxilia:pages", JSON.stringify(pages));
}
