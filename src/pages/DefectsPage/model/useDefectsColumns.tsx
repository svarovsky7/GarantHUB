import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button, Tooltip, Popconfirm, Modal, message } from 'antd';
import {
  EyeOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { DefectWithInfo } from '@/shared/types/defect';
import type { TableColumnSetting } from '@/shared/types/tableColumnSetting';
import DefectStatusSelect from '@/features/defect/DefectStatusSelect';
import { useDeleteDefect, useCancelDefectFix } from '@/entities/defect';
import { useRolePermission } from '@/entities/rolePermission';
import { useAuthStore } from '@/shared/store/authStore';
import type { RoleName } from '@/shared/types/rolePermission';
import { formatDate, formatDateTime } from '../lib/defectsHelpers';

const LS_COLUMNS_KEY = 'defectsColumns';
const LS_COLUMN_WIDTHS_KEY = 'defectsColumnWidths';

interface UseDefectsColumnsParams {
  lockedUnitIds: number[];
  onView: (id: number) => void;
  onFix: (id: number) => void;
}

/**
 * Хук для управления конфигурацией колонок таблицы дефектов
 */
export function useDefectsColumns({
  lockedUnitIds,
  onView,
  onFix,
}: UseDefectsColumnsParams) {
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const { mutateAsync: removeDefect, isPending: removing } = useDeleteDefect();
  const cancelFix = useCancelDefectFix();

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_COLUMN_WIDTHS_KEY) || '{}');
    } catch {
      return {};
    }
  });

  // Базовые колонки таблицы
  const baseColumns = useMemo(() => {
    const cols = {
      id: {
        title: 'ID дефекта',
        dataIndex: 'id',
        width: 80,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) => a.id - b.id,
        defaultSortOrder: 'descend' as const,
      },
      claims: {
        title: 'ID претензии',
        dataIndex: 'claimIds',
        width: 120,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) => {
          const aIds = (a.claimIds || []).join(',');
          const bIds = (b.claimIds || []).join(',');
          return aIds.localeCompare(bIds);
        },
        render: (v: number[]) => v.join(', '),
      },
      days: {
        title: (
          <span>
            Прошло дней
            <br />с даты получения
          </span>
        ),
        dataIndex: 'days',
        width: 120,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.days ?? -1) - (b.days ?? -1),
      },
      project: {
        title: 'Проект',
        dataIndex: 'projectNames',
        width: 180,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.projectNames || '').localeCompare(b.projectNames || ''),
      },
      building: {
        title: 'Корпус',
        dataIndex: 'buildingNames',
        width: 120,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.buildingNames || '').localeCompare(b.buildingNames || ''),
      },
      units: {
        title: 'Объекты',
        dataIndex: 'unitNamesList',
        width: 160,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.unitNames || '').localeCompare(b.unitNames || ''),
        render: (_: string[], row: DefectWithInfo) => (
          <>
            {row.unitNamesList?.map((n, i) => (
              <div key={i} style={{ whiteSpace: 'nowrap' }}>
                {n}
              </div>
            ))}
          </>
        ),
      },
      description: {
        title: 'Описание',
        dataIndex: 'description',
        width: 600,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          a.description.localeCompare(b.description),
      },
      type: {
        title: 'Тип',
        dataIndex: 'defectTypeName',
        width: 120,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.defectTypeName || '').localeCompare(b.defectTypeName || ''),
      },
      status: {
        title: 'Статус',
        dataIndex: 'status_id',
        width: 160,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.defectStatusName || '').localeCompare(b.defectStatusName || ''),
        render: (_: number, row: DefectWithInfo) => (
          <DefectStatusSelect
            defectId={row.id}
            statusId={row.status_id}
            statusName={row.defectStatusName}
            statusColor={row.defectStatusColor}
            locked={row.unit_id != null && lockedUnitIds.includes(row.unit_id)}
          />
        ),
      },
      warranty: {
        title: 'Гарантия',
        dataIndex: 'is_warranty',
        width: 100,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          Number(a.is_warranty) - Number(b.is_warranty),
        render: (v: boolean) => (v ? 'Да' : 'Нет'),
      },
      fixBy: {
        title: 'Кем устраняется',
        dataIndex: 'fixByName',
        width: 180,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.fixByName || '').localeCompare(b.fixByName || ''),
      },
      engineer: {
        title: 'Закрепленный инженер',
        dataIndex: 'engineerName',
        width: 180,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.engineerName || '').localeCompare(b.engineerName || ''),
      },
      received: {
        title: 'Дата получения',
        dataIndex: 'received_at',
        width: 120,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.received_at ? dayjs(a.received_at).valueOf() : 0) -
          (b.received_at ? dayjs(b.received_at).valueOf() : 0),
        render: formatDate,
      },
      createdAt: {
        title: 'Добавлено',
        dataIndex: 'created_at',
        width: 160,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.created_at ? dayjs(a.created_at).valueOf() : 0) -
          (b.created_at ? dayjs(b.created_at).valueOf() : 0),
        render: formatDateTime,
      },
      createdByName: {
        title: 'Автор',
        dataIndex: 'createdByName',
        width: 160,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.createdByName || '').localeCompare(b.createdByName || ''),
      },
      created: {
        title: 'Дата устранения',
        dataIndex: 'fixed_at',
        width: 120,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.fixed_at ? dayjs(a.fixed_at).valueOf() : 0) -
          (b.fixed_at ? dayjs(b.fixed_at).valueOf() : 0),
        render: formatDate,
      },
      files: {
        title: 'Файлы',
        dataIndex: 'filesCount',
        width: 80,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.filesCount ?? 0) - (b.filesCount ?? 0),
        render: (count: number) => count > 0 ? count : '—',
      },
      actions: {
        title: 'Действия',
        key: 'actions',
        width: 100,
        render: (_: unknown, row: DefectWithInfo) => (
          <>
            <Tooltip title="Просмотр">
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => onView(row.id)}
              />
            </Tooltip>
            {row.defectStatusName?.toLowerCase().includes('провер') ? (
              <Tooltip title="Отменить подтверждение">
                <Popconfirm
                  title="Отменить подтверждение устранения?"
                  okText="Да"
                  cancelText="Нет"
                  onConfirm={() => cancelFix.mutate(row.id)}
                  disabled={cancelFix.isPending}
                >
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={
                      <CloseOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
                    }
                    loading={cancelFix.isPending}
                  />
                </Popconfirm>
              </Tooltip>
            ) : (
              <Tooltip title="Устранён">
                <Button
                  size="small"
                  type="text"
                  icon={
                    <CheckOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                  }
                  onClick={() => {
                    if (
                      row.unit_id != null &&
                      lockedUnitIds.includes(row.unit_id)
                    ) {
                      Modal.warning({
                        title: 'Объект заблокирован',
                        content:
                          'Работы по устранению замечаний запрещено выполнять.',
                      });
                      return;
                    }
                    onFix(row.id);
                  }}
                />
              </Tooltip>
            )}
            {perm?.delete_tables.includes('defects') && (
              <Popconfirm
                title="Удалить дефект?"
                okText="Да"
                cancelText="Нет"
                onConfirm={async () => {
                  await removeDefect(row.id);
                  message.success('Удалено');
                }}
                disabled={removing}
              >
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  loading={removing}
                />
              </Popconfirm>
            )}
          </>
        ),
      } as any,
    } as Record<string, ColumnsType<DefectWithInfo>[number]>;

    Object.keys(cols).forEach((k) => {
      cols[k] = { ...cols[k], width: columnWidths[k] ?? cols[k].width };
    });
    return cols;
  }, [removeDefect, removing, columnWidths, lockedUnitIds, perm, onView, onFix, cancelFix]);

  const columnOrder = [
    'id',
    'claims',
    'days',
    'project',
    'building',
    'units',
    'description',
    'type',
    'status',
    'warranty',
    'fixBy',
    'received',
    'createdAt',
    'createdByName',
    'engineer',
    'created',
    'files',
    'actions',
  ] as const;

  const getTitleText = (t: React.ReactNode): string => {
    if (t == null || typeof t === 'boolean') return '';
    if (typeof t === 'string' || typeof t === 'number') return String(t);
    if (Array.isArray(t)) return t.map(getTitleText).join(' ');
    if (React.isValidElement(t)) {
      return getTitleText(t.props.children);
    }
    return String(t);
  };

  const [columnsState, setColumnsState] = useState<TableColumnSetting[]>(() => {
    const base = baseColumns;
    const defaults = columnOrder.map((key) => ({
      key,
      title: getTitleText(base[key].title as React.ReactNode),
      visible: !['createdAt', 'createdByName'].includes(key),
    }));
    try {
      const saved = localStorage.getItem(LS_COLUMNS_KEY);
      if (saved) {
        let parsed = JSON.parse(saved) as TableColumnSetting[];
        parsed = parsed.map((c) => {
          if (typeof c.title !== 'string') {
            const def = defaults.find((d) => d.key === c.key);
            return { ...c, title: def?.title ?? '' };
          }
          return c;
        });
        const filtered = parsed.filter((c) => base[c.key]);
        const missing = defaults.filter(
          (d) => !filtered.some((f) => f.key === d.key),
        );
        return [...filtered, ...missing];
      }
    } catch {}
    return defaults;
  });

  const handleResetColumns = useCallback(() => {
    const base = baseColumns;
    const defaults = columnOrder.map((key) => ({
      key,
      title: getTitleText(base[key].title as React.ReactNode),
      visible: !['createdAt', 'createdByName'].includes(key),
    }));
    try {
      localStorage.removeItem(LS_COLUMN_WIDTHS_KEY);
    } catch {}
    setColumnWidths({});
    setColumnsState(defaults);
  }, [baseColumns]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(columnsState));
    } catch {}
  }, [columnsState]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_COLUMN_WIDTHS_KEY, JSON.stringify(columnWidths));
    } catch {}
  }, [columnWidths]);

  const columns = useMemo(() => {
    const base = baseColumns;
    return columnsState.filter((c) => c.visible).map((c) => base[c.key]);
  }, [columnsState, baseColumns]);

  return {
    columns,
    columnsState,
    columnWidths,
    baseColumns,
    setColumnsState,
    setColumnWidths,
    handleResetColumns,
  };
}
