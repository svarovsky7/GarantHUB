import React from 'react';
import { Space, Radio, Select } from 'antd';
import type { Brigade } from '@/shared/types/brigade';
import type { Contractor } from '@/shared/types/contractor';

export interface FixByValue {
  brigade_id: number | null;
  contractor_id: number | null;
}

interface Props {
  value: FixByValue;
  onChange: (v: FixByValue) => void;
  brigades: Brigade[];
  contractors: Contractor[];
}

/**
 * Поле выбора исполнителя дефекта с переключателем
 * между собственной бригадой и подрядчиком.
 */
export default function FixBySelector({
  value,
  onChange,
  brigades,
  contractors,
}: Props) {
  const [mode, setMode] = React.useState<'brigade' | 'contractor'>(
    value.contractor_id ? 'contractor' : 'brigade',
  );

  React.useEffect(() => {
    if (value.contractor_id && mode !== 'contractor') setMode('contractor');
    if (value.brigade_id && mode !== 'brigade' && !value.contractor_id) setMode('brigade');
  }, [value, mode]);

  const handleModeChange = (m: 'brigade' | 'contractor') => {
    setMode(m);
    if (m === 'brigade') {
      onChange({ brigade_id: null, contractor_id: null });
    } else {
      onChange({ brigade_id: null, contractor_id: null });
    }
  };

  const handleSelect = (id: number | undefined) => {
    if (mode === 'brigade') {
      onChange({ brigade_id: id ?? null, contractor_id: null });
    } else {
      onChange({ brigade_id: null, contractor_id: id ?? null });
    }
  };

  const options = (mode === 'brigade' ? brigades : contractors).map((b) => ({
    value: b.id,
    label: b.name,
  }));

  const currentValue = mode === 'brigade' ? value.brigade_id ?? undefined : value.contractor_id ?? undefined;

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Radio.Group
        size="small"
        value={mode}
        onChange={(e) => handleModeChange(e.target.value)}
      >
        <Radio.Button value="brigade">Собст</Radio.Button>
        <Radio.Button value="contractor">Подряд</Radio.Button>
      </Radio.Group>
      <Select
        key={mode}
        size="small"
        placeholder="Исполнитель"
        allowClear
        value={currentValue}
        options={options}
        onChange={(v) => handleSelect(v)}
        showSearch
        filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
        style={{ width: '100%' }}
      />
    </Space>
  );
}
