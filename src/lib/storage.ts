import type { Page } from "../types";

// Are we inside an Electron **renderer** with Node integration?
const isElectron = typeof process !== "undefined"
  && process.versions?.node
  && process.versions?.electron;

// Pick the right implementation
const impl = isElectron
  ? await import("./storage-node")
  : await import("./storage-browser");

export const loadDB: () => Page[]       = impl.loadDB;
export const saveDB: (p: Page[]) => void = impl.saveDB;