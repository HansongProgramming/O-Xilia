import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

let storageFolder = app.getPath("userData"); // default
let dbFile = path.join(storageFolder, "pages.json");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- IPC HANDLERS ----------
ipcMain.handle("storage:choose-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    storageFolder = result.filePaths[0];
    dbFile = path.join(storageFolder, "pages.json");

    if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify([], null, 2), "utf8");

    return storageFolder;
  }

  return null;
});

ipcMain.handle("storage:load", () => {
  try {
    if (!fs.existsSync(dbFile)) return [];
    return JSON.parse(fs.readFileSync(dbFile, "utf8"));
  } catch (e) {
    console.error("Load failed", e);
    return [];
  }
});

ipcMain.handle("storage:save", (_event, pages) => {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(pages, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("Save failed", e);
    return false;
  }
});

// ---------- CREATE WINDOW ----------
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // must expose ipcRenderer
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
