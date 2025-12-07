const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("oXiliaAPI", {
  listNotes: () => ipcRenderer.invoke("notes:list"),
  loadNote: (id) => ipcRenderer.invoke("notes:load", id),
  createNote: (payload) => ipcRenderer.invoke("notes:create", payload),
  saveNote: (payload) => ipcRenderer.invoke("notes:save", payload),
  deleteNote: (id) => ipcRenderer.invoke("notes:delete", id),
  alert: (msg) => ipcRenderer.invoke("dialog:alert", msg),
});
