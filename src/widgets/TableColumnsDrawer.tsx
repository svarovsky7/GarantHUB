import React from 'react';
import { Drawer, Switch, Button, InputNumber } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import type { TableColumnSetting } from '@/shared/types/tableColumnSetting';

interface Props {
  open: boolean;
  columns: TableColumnSetting[];
  onChange: (cols: TableColumnSetting[]) => void;
  onClose: () => void;
  /** Текущие ширины столбцов */
  widths: Record<string, number | undefined>;
  onWidthsChange: (w: Record<string, number | undefined>) => void;
  /** Сбросить состояние столбцов к изначальному */
  onReset?: () => void;
}

/**
 * Боковая панель настройки столбцов таблицы.
 */
export default function TableColumnsDrawer({ open, columns, onChange, onClose, widths, onWidthsChange, onReset }: Props) {
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
        <div key={c.key} className="columns-drawer-row">
          <Switch checked={c.visible} onChange={(v) => toggle(idx, v)} size="small" />
          <span>{c.title || '(без названия)'}</span>
          <InputNumber
            className="columns-drawer-input"
            min={40}
            value={widths[c.key]}
            onChange={(v) =>
              onWidthsChange({ ...widths, [c.key]: typeof v === 'number' ? v : widths[c.key] })
            }
          />
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
      {onReset && (
        <Button style={{ marginTop: 16 }} block onClick={onReset}>
          По умолчанию
        </Button>
      )}
    </Drawer>
  );
}
