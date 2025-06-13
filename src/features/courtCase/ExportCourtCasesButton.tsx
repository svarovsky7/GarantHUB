import React from 'react';
import { Button, Tooltip } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import type { CourtCase } from '@/shared/types/courtCase';
import { getAttachmentsByIds } from '@/entities/attachment';

/** Параметры кнопки экспорта судебных дел. */
export interface ExportCourtCasesButtonProps {
  /** Список дел для выгрузки. */
  cases: (CourtCase & Record<string, any>)[];
  /** Словарь названий стадий по идентификатору. */
  stages: Record<number, string>;
}

/**
 * Кнопка выгрузки списка судебных дел в Excel.
 * Загружает недостающие файлы по их идентификаторам
 * и формирует таблицу в формате xlsx.
 */
export default function ExportCourtCasesButton({
  cases,
  stages,
}: ExportCourtCasesButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handleExport = React.useCallback(async () => {
    setLoading(true);
    try {
      const allIds = Array.from(
        new Set(cases.flatMap((c) => c.attachment_ids || [])),
      );
      let filesMap: Record<number, string> = {};
      if (allIds.length) {
        const files = await getAttachmentsByIds(allIds);
        filesMap = files.reduce<Record<number, string>>((acc, f) => {
          acc[f.id] = f.file_url;
          return acc;
        }, {});
      }
      const rows = cases.map((c) => ({
        ID: c.id,
        'ID родителя': c.parent_id ?? '',
        Проект: (c as any).projectName ?? '',
        Объекты: (c as any).projectObject ?? '',
        '№ дела': c.number,
        'Дата дела': dayjs(c.date).format('DD.MM.YYYY'),
        Статус: stages[c.status] || c.status,
        'Дело закрыто': c.is_closed ? 'Да' : 'Нет',
        Истец: (c as any).plaintiff ?? '',
        Ответчик: (c as any).defendant ?? '',
        'Ответственный юрист': (c as any).responsibleLawyer ?? '',
        'Дата начала устранения': c.fix_start_date
          ? dayjs(c.fix_start_date).format('DD.MM.YYYY')
          : '',
        'Дата завершения устранения': c.fix_end_date
          ? dayjs(c.fix_end_date).format('DD.MM.YYYY')
          : '',
        'Ссылки на файлы': (c.attachment_ids || [])
          .map((id) => filesMap[id])
          .filter(Boolean)
          .join('\n'),
        Описание: c.description ?? '',
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Cases');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'court_cases.xlsx');
    } finally {
      setLoading(false);
    }
  }, [cases, stages]);

  return (
    <Tooltip title="Выгрузить в Excel">
      <Button icon={<FileExcelOutlined />} loading={loading} onClick={handleExport} />
    </Tooltip>
  );
}
