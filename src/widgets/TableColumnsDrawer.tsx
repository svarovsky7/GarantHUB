import React from 'react';
import { Drawer, Switch, Button } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import type { TableColumnSetting } from '@/shared/types/tableColumnSetting';

interface Props {
  open: boolean;
  columns: TableColumnSetting[];
  onChange: (cols: TableColumnSetting[]) => void;
  onClose: () => void;
}

/**
 * Боковая панель настройки столбцов таблицы.
 */
export default function TableColumnsDrawer({ open, columns, onChange, onClose }: Props) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= columns.length) return;
    const updated = [...columns];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    onChange(updated);
  };

  const toggle = (index: number, value: boolean) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], visible: value };
    onChange(updated);
  };

  return (
    <Drawer title="Настройка столбцов" placement="right" onClose={onClose} open={open}>
      {columns.map((c, idx) => (
        <div key={c.key} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <Switch checked={c.visible} onChange={(v) => toggle(idx, v)} size="small" />
          <span style={{ marginLeft: 8, flexGrow: 1 }}>{c.title || '(без названия)'}</span>
          <Button
            size="small"
            type="text"
            icon={<UpOutlined />}
            disabled={idx === 0}
            onClick={() => move(idx, idx - 1)}
          />
          <Button
            size="small"
            type="text"
            icon={<DownOutlined />}
            disabled={idx === columns.length - 1}
            onClick={() => move(idx, idx + 1)}
          />
        </div>
      ))}
    </Drawer>
  );
}
