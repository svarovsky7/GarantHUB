import { useState, useEffect, useMemo, useRef } from 'react';
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
  /** Вызывается при изменении ширины столбцов */
  onWidthsChange?: (map: Record<string, number>) => void;
}

/**
 * Хук добавляет возможность изменять ширину колонок Ant Design таблицы.
 * @param initial исходный массив колонок
 */
export function useResizableColumns<T>(
  initial: ColumnsType<T>,
  options: UseResizableColumnsOptions = {},
): UseResizableColumnsResult<T> {
  const { storageKey, onWidthsChange } = options;

  const applySavedWidths = (cols: ColumnsType<T>): ColumnsType<T> => {
    if (!storageKey) return cols;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const map = JSON.parse(saved) as Record<string, number>;
        return cols.map((c) => {
          const key = String(c.key ?? c.dataIndex);
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

  const resizeTimeout = useRef<number>();
  const pending = useRef(cols);
  const flush = () => {
    setCols(pending.current);
    resizeTimeout.current = undefined;
  };
  const handleResize = (index: number) => (_: any, { size }: any) => {
    pending.current = pending.current.map((c, i) =>
      i === index ? { ...c, width: size.width } : c,
    );
    if (resizeTimeout.current) return;
    resizeTimeout.current = window.setTimeout(flush, 50);
  };

  useEffect(() => {
    if (!storageKey) return;
    try {
      const map: Record<string, number> = {};
      cols.forEach((c) => {
        const key = String(c.key ?? c.dataIndex);
        if (c.width) map[key] = c.width as number;
      });
      localStorage.setItem(storageKey, JSON.stringify(map));
    } catch {}
  }, [cols, storageKey]);

  const lastWidths = useRef('');
  useEffect(() => {
    if (!onWidthsChange) return;
    const map: Record<string, number> = {};
    cols.forEach((c) => {
      const key = String(c.key ?? c.dataIndex);
      if (c.width) map[key] = c.width as number;
    });
    const json = JSON.stringify(map);
    if (json !== lastWidths.current) {
      lastWidths.current = json;
      onWidthsChange(map);
    }
  }, [cols, onWidthsChange]);

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
