import React from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import type { IconPickerState } from "../types";

interface IconPickerMenuProps {
  iconPicker: IconPickerState;
  onEmojiSelect: (emoji: any) => void;
}

export default function IconPickerMenu({
  iconPicker,
  onEmojiSelect,
}: IconPickerMenuProps) {
  if (!iconPicker.visible) return null;

  return (
    <div
      className="icon-picker-wrapper"
      style={{
        position: "fixed",
        top: iconPicker.y,
        left: iconPicker.x,
        zIndex: 10000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Picker data={data} theme="dark" onEmojiSelect={onEmojiSelect} />
    </div>
  );
}
