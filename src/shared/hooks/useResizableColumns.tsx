import { useState, useEffect, useMemo } from 'react';
import { Resizable } from 'react-resizable';
import type { ColumnsType } from 'antd/es/table';

export interface UseResizableColumnsResult<T> {
  /** Колонки с возможностью изменения ширины */
  columns: ColumnsType<T>;
  /** Компоненты таблицы для Ant Design */
  components: Record<string, any>;
  /** Установить новое состояние колонок */
  setColumns: React.Dispatch<React.SetStateAction<ColumnsType<T>>>;
}

/** Опции хука useResizableColumns */
export interface UseResizableColumnsOptions {
  /**
   * Ключ в localStorage, куда сохраняются ширины колонок.
   * Если не указан, ширины не сохраняются.
   */
  storageKey?: string;
}

/**
 * Хук добавляет возможность изменять ширину колонок Ant Design таблицы.
 * @param initial исходный массив колонок
 */
export function useResizableColumns<T>(
  initial: ColumnsType<T>,
  options: UseResizableColumnsOptions = {},
): UseResizableColumnsResult<T> {
  const { storageKey } = options;

  const applySavedWidths = (cols: ColumnsType<T>): ColumnsType<T> => {
    if (!storageKey) return cols;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const map = JSON.parse(saved) as Record<string, number>;
        return cols.map((c) => {
          const key =
            'dataIndex' in c ? String(c.key ?? c.dataIndex) : String(c.key);
          const width = map[key];
          return width ? { ...c, width } : c;
        });
      }
    } catch {}
    return cols;
  };

  const [cols, setCols] = useState(() => applySavedWidths(initial));

  useEffect(() => {
    setCols(applySavedWidths(initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, storageKey]);

  const handleResize = (index: number) => (_: any, { size }: any) => {
    setCols((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], width: size.width };
      return next;
    });
  };

  useEffect(() => {
    if (!storageKey) return;
    try {
      const map: Record<string, number> = {};
      cols.forEach((c) => {
        const key =
          'dataIndex' in c ? String(c.key ?? c.dataIndex) : String(c.key);
        if (c.width) map[key] = c.width as number;
      });
      localStorage.setItem(storageKey, JSON.stringify(map));
    } catch {}
  }, [cols, storageKey]);

  const columns = useMemo(
    () =>
      cols.map((col, index) => ({
        ...col,
        onHeaderCell: (column: any) => ({
          width: column.width,
          onResize: handleResize(index),
        }),
      })),
    [cols],
  );

  const components = useMemo(
    () => ({
      header: {
        cell: (props: any) => {
          const { onResize, width, ...rest } = props;
          if (!width) return <th {...rest} />;
          return (
            <Resizable
              width={width}
              height={0}
              handle={<span className="resize-handle" />}
              onResize={onResize}
              draggableOpts={{ enableUserSelectHack: false }}
            >
              <th {...rest} />
            </Resizable>
          );
        },
      },
    }),
    [],
  );

  return { columns, components, setColumns: setCols };
}
