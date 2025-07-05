import React from 'react';
import { InputNumber, InputNumberProps } from 'antd';
import { formatRub, parseRub } from '@/shared/utils/formatCurrency';

export interface MoneyInputProps extends Omit<InputNumberProps, 'formatter' | 'parser'> {}

/**
 * Поле ввода денежных сумм в рублях с форматированием.
 */
export default function MoneyInput(props: MoneyInputProps) {
  return (
    <InputNumber
      {...props}
      precision={2}
      controls={false}
      inputMode="decimal"
      formatter={(value) => formatRub(Number(value))}
      parser={parseRub}
    />
  );
}
