import type { Page } from "../types";
import { join } from "path";
import { app } from "@electron/remote";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";

const DATA_FILE = join(app.getPath("userData"), "oxilia.json");

export function loadDB(): Page[] {
  try {
    if (!existsSync(DATA_FILE)) return [];
    return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export function saveDB(pages: Page[]) {
  const dir = join(DATA_FILE, "..");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(pages, null, 2));
}