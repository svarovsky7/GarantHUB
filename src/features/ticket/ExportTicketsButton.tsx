import React from 'react';
import { Button, Tooltip } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import type { TicketWithNames } from '@/shared/types/ticketWithNames';
import { TicketFilters } from '@/shared/types/ticketFilters';
import { filterTickets } from '@/shared/utils/ticketFilter';

export interface ExportTicketsButtonProps {
  /** Список замечаний */
  tickets: TicketWithNames[];
  /** Активные фильтры */
  filters: TicketFilters;
}

/** Кнопка экспорта списка замечаний в Excel */
export default function ExportTicketsButton({
  tickets,
  filters,
}: ExportTicketsButtonProps) {
  const handleClick = React.useCallback(() => {
    const today = dayjs();
    const rows = filterTickets(tickets, filters).map((t) => ({
      ID: t.id,
      'ID родителя': t.parentId ?? '',
      Проект: t.projectName,
      Объекты: t.unitNames,
      Гарантия: t.isWarranty ? 'Да' : 'Нет',
      Статус: t.statusName,
      'Замечание закрыто': t.isClosed ? 'Да' : 'Нет',
      'Тип замечания': t.typeName,
      'Дата получения': t.receivedAt ? t.receivedAt.format('DD.MM.YYYY') : '',
      'Прошло дней с Даты получения': t.receivedAt
        ? today.diff(t.receivedAt, 'day') + 1
        : '',
      'Дата устранения': t.fixedAt ? t.fixedAt.format('DD.MM.YYYY') : '',
      '№ заявки от Заказчика': t.customerRequestNo ?? '',
      'Дата заявки Заказчика': t.customerRequestDate
        ? t.customerRequestDate.format('DD.MM.YYYY')
        : '',
      'Ответственный инженер': t.responsibleEngineerName ?? '',
      'Краткое описание': t.title,
      'Подробное описание': t.description ?? '',
      'Ссылки на прикрепленные файлы': (t.attachments ?? [])
        .map((a) => a.url)
        // Используем символ \n для переноса строк в Excel.
        // Ранее использовалась строка "\\n", из-за чего в ячейке отображалась
        // последовательность "\n" без фактического переноса строки.
        .join('\n'),
      Название: t.parentId ? `↳ ${t.title}` : t.title,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Tickets');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'tickets.xlsx');
  }, [tickets, filters]);

  return (
    <Tooltip title="Выгрузить в Excel">
      <Button icon={<DownloadOutlined />} onClick={handleClick} />
    </Tooltip>
  );
}
