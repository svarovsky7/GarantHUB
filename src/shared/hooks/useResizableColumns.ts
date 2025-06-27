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

/**
 * Хук добавляет возможность изменять ширину колонок Ant Design таблицы.
 * @param initial исходный массив колонок
 */
export function useResizableColumns<T>(
  initial: ColumnsType<T>,
): UseResizableColumnsResult<T> {
  const [cols, setCols] = useState(initial);

  useEffect(() => setCols(initial), [initial]);

  const handleResize = (index: number) => (_: any, { size }: any) => {
    setCols((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], width: size.width };
      return next;
    });
  };

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
