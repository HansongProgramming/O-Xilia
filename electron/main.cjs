const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
    preload: path.join(__dirname, "preload.cjs")
    }
  });

  // Load your React/Vite dev server or built index.html
  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");  // Vite dev server
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

// ---------------------
// JSON STORAGE HANDLERS
// ---------------------

const dbPath = path.join(app.getPath("userData"), "pages.json");

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
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("Save failed", e);
    return false;
  }
});
