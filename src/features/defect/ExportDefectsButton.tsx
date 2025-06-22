import React from 'react';
import { Button, Tooltip } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import type { DefectWithInfo } from '@/shared/types/defect';
import type { DefectFilters } from '@/shared/types/defectFilters';
import { filterDefects } from '@/shared/utils/defectFilter';

export interface ExportDefectsButtonProps {
  /** Список дефектов */
  defects: DefectWithInfo[];
  /** Активные фильтры */
  filters: DefectFilters;
}

/** Кнопка выгрузки дефектов в Excel */
export default function ExportDefectsButton({
  defects,
  filters,
}: ExportDefectsButtonProps) {
  const handleClick = React.useCallback(async () => {
    const today = dayjs();
    const rows = filterDefects(defects, filters).map((d) => ({
      'ID дефекта': d.id,
      'ID претензии': d.claimIds.join(', '),
      Проект: d.projectNames ?? '',
      Объекты: d.unitNames ?? '',
      Описание: d.description,
      Тип: d.defectTypeName ?? '',
      Статус: d.defectStatusName ?? '',
      'Кем устраняется': d.fixByName ?? '',
      'Дата получения': d.received_at ? dayjs(d.received_at).format('DD.MM.YYYY') : '',
      'Прошло дней с Даты получения': d.received_at
        ? today.diff(dayjs(d.received_at), 'day') + 1
        : '',
      'Дата создания': d.created_at ? dayjs(d.created_at).format('DD.MM.YYYY') : '',
    }));
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Defects');
    if (rows.length) {
      ws.columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
      rows.forEach((r) => ws.addRow(r));
    }
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'defects.xlsx');
  }, [defects, filters]);

  return (
    <Tooltip title="Выгрузить в Excel">
      <Button icon={<DownloadOutlined />} onClick={handleClick} />
    </Tooltip>
  );
}
