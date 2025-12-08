import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Needed for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to JSON storage
const dbPath = path.join(app.getPath("userData"), "pages.json");

// ---------------------
// JSON STORAGE HANDLERS
// ---------------------
ipcMain.handle("storage:load", () => {
  try {
    if (!fs.existsSync(dbPath)) return [];
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
  } catch (e) {
    console.error("Load failed", e);
    return [];
  }
});

ipcMain.handle("storage:save", (_event, data) => {
  try {
    console.log("Saving in main process", data.length, "pages");
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("Save failed", e);
    return false;
  }
});

// ---------------------
// CREATE WINDOW
// ---------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load React dev server or production build
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
