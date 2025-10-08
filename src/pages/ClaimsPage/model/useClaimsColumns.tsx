import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button, Tooltip, Popconfirm, Space, message } from 'antd';
import {
  EyeOutlined,
  DeleteOutlined,
  BranchesOutlined,
  FileTextOutlined,
  LinkOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ClaimTableData } from '../types/ClaimTableData';
import type { TableColumnSetting } from '@/shared/types/tableColumnSetting';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import ClaimStatusSelect from '@/features/claim/ClaimStatusSelect';
import { useDeleteClaim } from '@/entities/claim';
import dayjs from 'dayjs';
import { formatDate, formatDateTime, getTitleText } from '../lib/claimsHelpers';

const LS_COLUMNS_KEY = 'claimsColumns';
const LS_COLUMN_WIDTHS_KEY = 'claimsColumnWidths';

interface UseClaimsColumnsParams {
  lockedUnitIds: number[];
  onView: (id: number) => void;
  onAddChild: (parent: ClaimWithNames) => void;
  onUnlink: (id: number) => void;
}

/**
 * Хук для управления конфигурацией колонок таблицы претензий
 */
export function useClaimsColumns({
  lockedUnitIds,
  onView,
  onAddChild,
  onUnlink,
}: UseClaimsColumnsParams) {
  const { mutateAsync: remove, isPending: removing } = useDeleteClaim();

  // Состояние колонок таблицы
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
      treeIcon: {
        title: '',
        dataIndex: 'treeIcon',
        width: 40,
        render: (_: unknown, record: ClaimTableData) => {
          if (!record.parent_id) {
            return (
              <Tooltip title="Основная претензия">
                <FileTextOutlined style={{ color: '#1890ff', fontSize: 17 }} />
              </Tooltip>
            );
          }
          return (
            <Tooltip title="Связанная претензия">
              <BranchesOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            </Tooltip>
          );
        },
      },
      id: {
        title: 'ID',
        dataIndex: 'id',
        width: 80,
        sorter: (a: ClaimTableData, b: ClaimTableData) => a.id - b.id,
      },
      projectName: {
        title: 'Проект',
        dataIndex: 'projectName',
        width: 180,
        sorter: (a: ClaimTableData, b: ClaimTableData) => a.projectName.localeCompare(b.projectName),
      },
      buildings: {
        title: 'Корпус',
        dataIndex: 'buildings',
        width: 120,
        sorter: (a: ClaimTableData, b: ClaimTableData) => (a.buildings || '').localeCompare(b.buildings || ''),
      },
      unitNames: {
        title: 'Объекты',
        dataIndex: 'unitNames',
        width: 160,
        sorter: (a: ClaimTableData, b: ClaimTableData) => a.unitNames.localeCompare(b.unitNames),
      },
      claim_status_id: {
        title: 'Статус',
        dataIndex: 'claim_status_id',
        width: 160,
        sorter: (a: ClaimTableData, b: ClaimTableData) => a.statusName.localeCompare(b.statusName),
        render: (_: unknown, row: ClaimTableData) => (
          <ClaimStatusSelect
            claimId={row.id}
            statusId={row.claim_status_id}
            statusColor={row.statusColor}
            statusName={row.statusName}
            locked={row.unit_ids?.some((id: number) =>
              lockedUnitIds.includes(id),
            )}
          />
        ),
      },
      claim_no: {
        title: '№ претензии',
        dataIndex: 'claim_no',
        width: 160,
        sorter: (a: ClaimTableData, b: ClaimTableData) => a.claim_no.localeCompare(b.claim_no),
      },
      claimedOn: {
        title: 'Дата претензии',
        dataIndex: 'claimedOn',
        width: 120,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.claimedOn ? a.claimedOn.valueOf() : 0) -
          (b.claimedOn ? b.claimedOn.valueOf() : 0),
        render: (v: dayjs.Dayjs | null) => formatDate(v),
      },
      acceptedOn: {
        title: 'Дата получения Застройщиком',
        dataIndex: 'acceptedOn',
        width: 120,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.acceptedOn ? a.acceptedOn.valueOf() : 0) -
          (b.acceptedOn ? b.acceptedOn.valueOf() : 0),
        render: (v: dayjs.Dayjs | null) => formatDate(v),
      },
      registeredOn: {
        title: 'Дата регистрации претензии',
        dataIndex: 'registeredOn',
        width: 120,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.registeredOn ? a.registeredOn.valueOf() : 0) -
          (b.registeredOn ? b.registeredOn.valueOf() : 0),
        render: (v: dayjs.Dayjs | null) => formatDate(v),
      },
      resolvedOn: {
        title: 'Дата устранения',
        dataIndex: 'resolvedOn',
        width: 120,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.resolvedOn ? a.resolvedOn.valueOf() : 0) -
          (b.resolvedOn ? b.resolvedOn.valueOf() : 0),
        render: (v: dayjs.Dayjs | null) => formatDate(v),
      },
      responsibleEngineerName: {
        title: 'Закрепленный инженер',
        dataIndex: 'responsibleEngineerName',
        width: 180,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.responsibleEngineerName || '').localeCompare(
            b.responsibleEngineerName || '',
          ),
      },
      createdAt: {
        title: 'Добавлено',
        dataIndex: 'createdAt',
        width: 160,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.createdAt ? a.createdAt.valueOf() : 0) -
          (b.createdAt ? b.createdAt.valueOf() : 0),
        render: (v: dayjs.Dayjs | null) => formatDateTime(v),
      },
      createdByName: {
        title: 'Автор',
        dataIndex: 'createdByName',
        width: 160,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.createdByName || '').localeCompare(b.createdByName || ''),
      },
      actions: {
        title: 'Действия',
        key: 'actions',
        width: 140,
        render: (_: unknown, record: ClaimTableData) => (
          <Space size="middle">
            <Tooltip title="Просмотр">
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => onView(record.id)}
              />
            </Tooltip>
            <Button
              size="small"
              type="text"
              icon={<PlusOutlined />}
              onClick={() => onAddChild(record)}
            />
            {record.parent_id && (
              <Tooltip title="Исключить из связи">
                <Button
                  size="small"
                  type="text"
                  icon={
                    <LinkOutlined
                      style={{
                        color: '#c41d7f',
                        textDecoration: 'line-through',
                        fontWeight: 700,
                      }}
                    />
                  }
                  onClick={() => onUnlink(record.id)}
                />
              </Tooltip>
            )}
            <Popconfirm
              title="Удалить претензию?"
              okText="Да"
              cancelText="Нет"
              onConfirm={async () => {
                await remove({ id: record.id });
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
          </Space>
        ),
      },
    } as Record<string, ColumnsType<ClaimTableData>[number]>;

    // Применяем сохраненные ширины колонок
    Object.keys(cols).forEach((k) => {
      if (cols[k]) {
        cols[k] = { ...cols[k], width: columnWidths[k] ?? cols[k].width };
      }
    });

    return cols;
  }, [columnWidths, lockedUnitIds, onView, onAddChild, onUnlink, remove, removing]);

  // Порядок колонок
  const columnOrder = [
    'treeIcon',
    'id',
    'projectName',
    'buildings',
    'unitNames',
    'claim_status_id',
    'claim_no',
    'claimedOn',
    'acceptedOn',
    'registeredOn',
    'resolvedOn',
    'responsibleEngineerName',
    'createdAt',
    'createdByName',
    'actions',
  ];

  // Состояние видимости и порядка колонок
  const [columnsState, setColumnsState] = useState<TableColumnSetting[]>(() => {
    try {
      const saved = localStorage.getItem(LS_COLUMNS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}

    // Настройки по умолчанию
    return columnOrder.map((key) => ({
      key,
      title: getTitleText(baseColumns[key].title as React.ReactNode),
      visible: !['createdAt', 'createdByName'].includes(key),
    }));
  });

  // Функция сброса колонок
  const handleResetColumns = useCallback(() => {
    const defaults = columnOrder.map((key) => ({
      key,
      title: getTitleText(baseColumns[key].title as React.ReactNode),
      visible: !['createdAt', 'createdByName'].includes(key),
    }));
    setColumnsState(defaults);
    setColumnWidths({});
  }, [baseColumns]);

  // Эффекты для сохранения состояния
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

  // Финальные колонки для таблицы
  const columns: ColumnsType<ClaimTableData> = useMemo(() => {
    return columnsState
      .filter((c) => c.visible && baseColumns[c.key])
      .map((c) => baseColumns[c.key]);
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
