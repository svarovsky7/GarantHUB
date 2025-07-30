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
      console.log('ExportDefectsButton: Начало экспорта');
      console.log('ExportDefectsButton: Дефектов для экспорта:', defects.length);
      
      if (defects.length === 0) {
        console.warn('ExportDefectsButton: Нет дефектов для экспорта');
        // Показываем пользователю уведомление
        import('antd').then(({ message }) => {
          message.warning('Нет дефектов для экспорта. Проверьте фильтры или убедитесь, что дефекты загружены.');
        });
        return;
      }
      
      const today = dayjs();
      
      const ids = defects.map((d) => d.id);
      let filesMap: Record<number, string[]> = {};
      
      if (ids.length) {
        console.log('ExportDefectsButton: Загрузка файлов для дефектов:', ids.length);
        
        // Разбиваем ID на чанки по 1000 элементов, чтобы избежать слишком длинных URL
        const chunkSize = 1000;
        const chunks = [];
        for (let i = 0; i < ids.length; i += chunkSize) {
          chunks.push(ids.slice(i, i + chunkSize));
        }
        
        console.log('ExportDefectsButton: Загрузка файлов по частям:', chunks.length, 'чанков');
        
        // Выполняем запросы по частям
        for (const chunk of chunks) {
          const { data, error } = await supabase
            .from('defect_attachments')
            .select('defect_id, attachments(file_url:path)')
            .in('defect_id', chunk);
          
          if (error) {
            console.error('ExportDefectsButton: Ошибка загрузки файлов:', error);
            throw error;
          }
          
          // Объединяем результаты
          const chunkFilesMap = (data ?? []).reduce<Record<number, string[]>>((acc, row: any) => {
            const url = row.attachments?.file_url;
            if (url) {
              if (!acc[row.defect_id]) acc[row.defect_id] = [];
              acc[row.defect_id].push(url);
            }
            return acc;
          }, {});
          
          // Объединяем с общей картой
          Object.keys(chunkFilesMap).forEach(defectId => {
            const id = parseInt(defectId);
            if (!filesMap[id]) filesMap[id] = [];
            filesMap[id].push(...chunkFilesMap[id]);
          });
        }
        
        console.log('ExportDefectsButton: Найдено файлов:', Object.keys(filesMap).length);
      }
      
      console.log('ExportDefectsButton: Формирование строк Excel');
      const rows = defects.map((d) => ({
        'ID дефекта': d.id,
        'ID претензии': d.claimIds.join(', '),
        Проект: d.projectNames ?? '',
        Корпус: d.buildingNames ?? '',
        Объекты: d.unitNames ?? '',
        Описание: d.description,
        Тип: d.defectTypeName ?? '',
        Статус: d.defectStatusName ?? '',
        'Кем устраняется': d.fixByName ?? '',
        'Закрепленный инженер': d.engineerName ?? '',
        Автор: d.createdByName ?? '',
        'Дата получения': d.received_at ? dayjs(d.received_at).format('DD.MM.YYYY') : '',
        'Добавлено': d.created_at ? dayjs(d.created_at).format('DD.MM.YYYY HH:mm') : '',
        'Дата устранения': d.fixed_at ? dayjs(d.fixed_at).format('DD.MM.YYYY') : '',
        'Прошло дней с Даты получения': d.received_at
          ? today.diff(dayjs(d.received_at), 'day') + 1
          : '',
        'Ссылки на файлы': (filesMap[d.id] ?? []).join('\n'),
      }));
      
      console.log('ExportDefectsButton: Создание Excel файла');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Defects');
      if (rows.length) {
        ws.columns = Object.keys(rows[0]).map((key) => ({ header: key, key }));
        rows.forEach((r) => ws.addRow(r));
      }
      
      console.log('ExportDefectsButton: Сохранение файла');
      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'defects.xlsx');
      console.log('ExportDefectsButton: Экспорт завершен успешно');
      
      // Показываем пользователю уведомление об успехе
      import('antd').then(({ message }) => {
        message.success(`Экспорт завершен успешно. Выгружено ${defects.length} дефектов.`);
      });
      
    } catch (error) {
      console.error('ExportDefectsButton: Ошибка экспорта:', error);
      // Показываем пользователю уведомление об ошибке
      import('antd').then(({ message }) => {
        message.error('Ошибка при экспорте данных. Проверьте консоль браузера для подробностей.');
      });
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
