// src/hooks/useAutoSave.ts
import { useEffect } from "react";
import { saveDB } from "../lib/storage";
import type { Category } from "../types";

export function useAutoSave(categories: Category[], isLoading: boolean) {
  useEffect(() => {
    if (!isLoading && categories.length > 0) {
      const t = setTimeout(() => saveDB(categories), 300);
      return () => clearTimeout(t);
    }
  }, [categories, isLoading]);
}
