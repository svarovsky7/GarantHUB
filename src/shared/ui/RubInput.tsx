import React from 'react';
import { InputNumber } from 'antd';
import { formatRub, parseRub } from '@/shared/utils/formatCurrency';

/**
 * Поле ввода денежных сумм в рублях с сохранением значения при потере фокуса.
 */
interface Props {
  value?: number | null;
  /** Вызывается при завершении ввода (onBlur). */
  onCommit?: (value: number | null) => void;
}

export default function RubInput({ value, onCommit }: Props) {
  const [internal, setInternal] = React.useState<number | null | undefined>(
    value ?? undefined,
  );

  React.useEffect(() => {
    setInternal(value ?? undefined);
  }, [value]);

  const handleBlur = () => {
    onCommit?.(internal ?? null);
  };

  return (
    <InputNumber
      min={0}
      style={{ width: '100%' }}
      value={internal ?? undefined}
      formatter={(val) => formatRub(Number(val))}
      parser={parseRub}
      onChange={(v) => setInternal(v ?? null)}
      onBlur={handleBlur}
    />
  );
}
