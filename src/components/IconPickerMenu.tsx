import { Icon } from '@iconify/react';
import icCollection from '@iconify-json/ic/icons.json'; // JSON of all icons
import type { IconPickerState } from "../types";

interface IconPickerMenuProps {
  iconPicker: IconPickerState;
  onIconSelect: (iconName: string) => void;
}

export default function IconPickerMenu({
  iconPicker,
  onIconSelect,
}: IconPickerMenuProps) {
  if (!iconPicker.visible) return null;

  // Get all icon names
  const icons = Object.keys(icCollection.icons);

  return (
    <div
      className="icon-picker-wrapper"
      style={{
        position: 'fixed',
        top: iconPicker.y,
        left: iconPicker.x,
        zIndex: 10000,
        background: '#222',
        padding: '8px',
        borderRadius: '8px',
        maxHeight: '300px',
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 32px)',
        gap: '8px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {icons.map((iconName) => (
        <div
          key={iconName}
          style={{ cursor: 'pointer' }}
          onClick={() => onIconSelect(iconName)}
        >
          <Icon icon={`ic:${iconName}`} width="24" height="24" />
        </div>
      ))}
    </div>
  );
}
