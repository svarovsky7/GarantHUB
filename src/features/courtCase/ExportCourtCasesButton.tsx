import React from 'react';
import { Button, Tooltip } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import ExcelJS from 'exceljs';
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
  /** ID стадии "Закрыто" */
  closedStageId?: number;
}

/**
 * Кнопка выгрузки списка судебных дел в Excel.
 * Загружает недостающие файлы по их идентификаторам
 * и формирует таблицу в формате XLSX с использованием exceljs.
 */
export default function ExportCourtCasesButton({
  cases,
  stages,
  closedStageId,
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
        'Дело закрыто': closedStageId ? (c.status === closedStageId ? 'Да' : 'Нет') : '',
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
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Cases');
      if (rows.length) {
        ws.columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
        rows.forEach((r) => ws.addRow(r));
      }
      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'court_cases.xlsx');
    } finally {
      setLoading(false);
    }
  }, [cases, stages, closedStageId]);

  return (
    <Tooltip title="Выгрузить в Excel">
      <Button icon={<DownloadOutlined />} loading={loading} onClick={handleExport} />
    </Tooltip>
  );
}
