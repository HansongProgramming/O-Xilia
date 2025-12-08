import { app } from "electron";
import fs from "fs";
import path from "path";

const filePath = path.join(app.getPath("userData"), "oxilia.json");

export function loadPages() {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load JSON:", err);
    return [];
  }
}

export function savePages(pages) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(pages, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save JSON:", err);
  }
}

export const storageFilePath = filePath;
