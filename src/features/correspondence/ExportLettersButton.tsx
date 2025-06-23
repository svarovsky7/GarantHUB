import React from 'react';
import { Button, Tooltip } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import { CorrespondenceLetter } from '@/shared/types/correspondence';
import { useNotify } from '@/shared/hooks/useNotify';

interface Option { id: number | string; name: string; }

interface ExportLettersButtonProps {
  letters: CorrespondenceLetter[];
  users: Option[];
  letterTypes: Option[];
  projects: Option[];
  units: Option[];
  statuses: Option[];
}

/**
 * Кнопка выгрузки списка писем в Excel.
 * Использует библиотеку exceljs и file-saver.
 */
export default function ExportLettersButton({
  letters,
  users,
  letterTypes,
  projects,
  units,
  statuses,
}: ExportLettersButtonProps) {
  const notify = useNotify();

  const maps = React.useMemo(() => {
    const m = {
      user: {} as Record<string, string>,
      type: {} as Record<number, string>,
      project: {} as Record<number, string>,
      unit: {} as Record<number, string>,
      status: {} as Record<number, string>,
    };
    users.forEach((u) => (m.user[u.id as string] = u.name));
    letterTypes.forEach((t) => (m.type[t.id as number] = t.name));
    projects.forEach((p) => (m.project[p.id as number] = p.name));
    units.forEach((u) => (m.unit[u.id as number] = u.name));
    statuses.forEach((s) => (m.status[s.id as number] = s.name));
    return m;
  }, [users, letterTypes, projects, units, statuses]);

  const handleExport = async () => {
    const data = letters.map((l) => ({
      ID: l.id,
      'ID родителя': l.parent_id ?? '',
      Тип: l.type === 'incoming' ? 'Входящее' : 'Исходящее',
      Номер: l.number,
      Дата: dayjs(l.date).format('DD.MM.YYYY'),
      Отправитель: l.sender,
      Получатель: l.receiver,
      Тема: l.subject,
      Проект: l.project_id ? maps.project[l.project_id] : '',
      Объекты: l.unit_ids.map((id) => maps.unit[id]).filter(Boolean).join(', '),
      Категория: l.letter_type_id ? maps.type[l.letter_type_id] : '',
      Статус: l.status_id ? maps.status[l.status_id] : '',
      Ответственный: l.responsible_user_id ? maps.user[l.responsible_user_id] : '',
      Содержание: l.content,
      'Ссылки на файлы': (l.attachments ?? []).map((a) => a.path).join('\n'),
    }));
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Letters');
    if (data.length) {
      ws.columns = Object.keys(data[0]).map((key) => ({ header: key, key }));
      data.forEach((row) => ws.addRow(row));
    }
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(blob, 'letters.xlsx');
    notify.success('Файл сохранён');
  };

  return (
    <Tooltip title="Выгрузить в Excel">
      <Button icon={<DownloadOutlined />} onClick={handleExport} />
    </Tooltip>
  );
}
