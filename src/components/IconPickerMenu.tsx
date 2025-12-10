import { useState, useMemo } from "react";
import { Icon } from '@iconify/react';
import icCollection from '@iconify-json/ic/icons.json';
import type { IconPickerState } from "../types";

interface IconPickerMenuProps {
  iconPicker: IconPickerState;
  onIconSelect: (iconName: string) => void;
}

export default function IconPickerMenu({
  iconPicker,
  onIconSelect,
}: IconPickerMenuProps) {
  // Hooks must always be called
  const [search, setSearch] = useState("");

  // Filter icons
  const icons = useMemo(
    () =>
      Object.keys(icCollection.icons).filter((name) =>
        name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  // Only render if visible
  if (!iconPicker.visible) return null;

  return (
    <div
      className="icon-picker-wrapper"
      style={{
        position: "fixed",
        top: iconPicker.y,
        left: iconPicker.x,
        zIndex: 10000,
        background: "#222",
        padding: "8px",
        borderRadius: "8px",
        maxHeight: "300px",
        overflowY: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="text"
        placeholder="Search icons..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          marginBottom: "8px",
          padding: "4px 6px",
          borderRadius: "4px",
          border: "none",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 32px)",
          gap: "8px",
        }}
      >
        {icons.map((iconName) => (
          <div
            key={iconName}
            style={{ cursor: "pointer" }}
            onClick={() => onIconSelect(iconName)}
          >
            <Icon icon={`ic:${iconName}`} width="24" height="24" color="#fff" />
          </div>
        ))}
      </div>
    </div>
  );
}
