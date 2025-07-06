import React from 'react';
import { Button, Tooltip } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import { supabase } from '@/shared/api/supabaseClient';
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
  const [loading, setLoading] = React.useState(false);

  const handleClick = React.useCallback(async () => {
    setLoading(true);
    try {
      const today = dayjs();
      const filtered = filterDefects(defects, filters);
      const ids = filtered.map((d) => d.id);
      let filesMap: Record<number, string[]> = {};
      if (ids.length) {
        const { data, error } = await supabase
          .from('defect_attachments')
          .select('defect_id, attachments(file_url:path)')
          .in('defect_id', ids);
        if (error) throw error;
        filesMap = (data ?? []).reduce<Record<number, string[]>>((acc, row: any) => {
          const url = row.attachments?.file_url;
          if (url) {
            if (!acc[row.defect_id]) acc[row.defect_id] = [];
            acc[row.defect_id].push(url);
          }
          return acc;
        }, {});
      }
      const rows = filtered.map((d) => ({
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
        'Ссылки на файлы': (filesMap[d.id] ?? []).join('\n'),
      }));
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Defects');
      if (rows.length) {
        ws.columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
        rows.forEach((r) => ws.addRow(r));
      }
      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'defects.xlsx');
    } finally {
      setLoading(false);
    }
  }, [defects, filters]);

  return (
    <Tooltip title="Выгрузить в Excel">
      <Button icon={<DownloadOutlined />} loading={loading} onClick={handleClick} />
    </Tooltip>
  );
}
