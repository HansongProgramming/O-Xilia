// lib/storage.ts
import type { Category } from "../types";

const isElectron = !!(window as any).storage;

export async function chooseFolder(): Promise<string | null> {
  if (!isElectron) return null;
  return await (window as any).storage.chooseFolder();
}

export async function loadDB(): Promise<Category[]> {
  if (isElectron) {
    const data = await (window as any).storage.load();
    return data.categories || [];
  }
  const raw = localStorage.getItem("oxilia:categories");
  return raw ? JSON.parse(raw) : [];
}

export async function saveDB(categories: Category[]): Promise<void> {
  if (isElectron) {
    return await (window as any).storage.save({ categories });
  }
  localStorage.setItem("oxilia:categories", JSON.stringify(categories));
}