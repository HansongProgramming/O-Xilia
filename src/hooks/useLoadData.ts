// src/hooks/useLoadData.ts
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { loadDB } from "../lib/storage";
import type { Category, Page } from "../types";

export function useLoadData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activePageId, setActivePageId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const data = await loadDB();

        if (data && data.length > 0) {
          setCategories(data);

          const firstPage = data
            .flatMap((c) => c.pages || [])
            .find((p) => p);

          if (firstPage) setActivePageId(firstPage.id);
        } else {
          const defaultPage: Page = {
            id: uuid(),
            title: "Welcome to O-Xilia",
            blocks: [{ type: "paragraph", content: "Start your first note..." }],
            icon: "📄",
            categoryId: "default-category",
          };

          const defaultCategory: Category = {
            id: "default-category",
            name: "Default",
            icon: "📁",
            isExpanded: true,
            pages: [defaultPage],
          };

          setCategories([defaultCategory]);
          setActivePageId(defaultPage.id);
        }
      } catch {
        const fallbackPage: Page = {
          id: uuid(),
          title: "Untitled",
          categoryId: "fallback-category",
          blocks: [{ type: "paragraph", content: "" }],
          icon: "📄",
        };

        const fallbackCategory: Category = {
          id: "fallback-category",
          name: "Default",
          icon: "📁",
          isExpanded: true,
          pages: [fallbackPage],
        };

        setCategories([fallbackCategory]);
        setActivePageId(fallbackPage.id);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  return { categories, setCategories, activePageId, setActivePageId, isLoading };
}
