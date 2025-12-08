const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("storage", {
  load: () => ipcRenderer.invoke("storage:load"),
  save: (pages) => ipcRenderer.invoke("storage:save", pages)
});