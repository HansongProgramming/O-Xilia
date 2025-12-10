// src/hooks/useOutsideClick.ts
import { useEffect } from "react";
import type { ContextMenuState, IconPickerState } from "../types";

export function useOutsideClick(
  setContextMenu: (cb: (s: ContextMenuState) => ContextMenuState) => void,
  setIconPicker: (cb: (s: IconPickerState) => IconPickerState) => void
) {
  useEffect(() => {
    const closeAll = () => {
      setContextMenu((s) => ({ ...s, visible: false, type: null, categoryId: null }));
      setIconPicker((s) => ({ ...s, visible: false, forType: null, id: null }));
    };

    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);
}
