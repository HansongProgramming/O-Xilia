const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs/promises");

const NOTES_DIR = path.join(app.getPath("userData"), "notes");

// Ensure notes folder exists
async function ensureNotesDir() {
  await fs.mkdir(NOTES_DIR, { recursive: true });
  return NOTES_DIR;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Fixed path
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

app.whenReady().then(createWindow);

// IPC Handlers
ipcMain.handle("notes:list", async () => {
  const dir = await ensureNotesDir();
  const files = await fs.readdir(dir);
  const notes = [];

  for (const f of files) {
    if (f.endsWith(".json")) {
      const stat = await fs.stat(path.join(dir, f));
      notes.push({ id: f.replace(/\.json$/, ""), file: f, mtime: stat.mtimeMs });
    }
  }

  return notes.sort((a, b) => b.mtime - a.mtime);
});

ipcMain.handle("notes:load", async (event, id) => {
  try {
    const raw = await fs.readFile(path.join(NOTES_DIR, `${id}.json`), "utf8");
    const data = JSON.parse(raw);
    return data.content || data; // Handle both old and new formats
  } catch {
    return null;
  }
});

ipcMain.handle("notes:create", async (event, { id, content }) => {
  await fs.writeFile(
    path.join(NOTES_DIR, `${id}.json`),
    JSON.stringify({ meta: { createdAt: new Date().toISOString() }, content }, null, 2)
  );
  return { ok: true };
});

ipcMain.handle("notes:save", async (event, { id, content }) => {
  await fs.writeFile(
    path.join(NOTES_DIR, `${id}.json`),
    JSON.stringify({ meta: { updatedAt: new Date().toISOString() }, content }, null, 2)
  );
  return { ok: true };
});

ipcMain.handle("notes:delete", async (event, id) => {
  try {
    await fs.unlink(path.join(NOTES_DIR, `${id}.json`));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle("dialog:alert", async (event, message) => {
  dialog.showMessageBox({ message, buttons: ["OK"] });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});