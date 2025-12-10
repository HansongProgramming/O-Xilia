import React from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";


type Props = {
visible: boolean;
x: number;
y: number;
onSelect: (emoji: any) => void;
};


export function IconPicker({ visible, x, y, onSelect }: Props) {
if (!visible) return null;


return (
<div className="icon-picker-wrapper" style={{ position: "fixed", top: `${y}px`, left: `${x}px`, zIndex: 10000 }} onClick={(e) => e.stopPropagation()}>
<Picker data={data} theme="dark" onEmojiSelect={(emoji: any) => onSelect(emoji)} />
</div>
);
}