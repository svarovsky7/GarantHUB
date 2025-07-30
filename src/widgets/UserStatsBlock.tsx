import React from 'react';
import dayjs from 'dayjs';
import {
  ConfigProvider,
  Card,
  Select,
  DatePicker,
  Space,
  Table,
  Skeleton,
  Statistic,
  Segmented,
  Alert,
  Button,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import { useUsers } from '@/entities/user';
import { useMultipleUserStats, useMultipleUserStatsOptimized } from '@/shared/hooks/useUserStats';
import { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

/**
 * Блок статистики по выбранному пользователю и периоду.
 */
dayjs.locale('ru');

export default function UserStatsBlock({
  projectIds,
  resetSignal = 0,
}: {
  projectIds?: number[];
  resetSignal?: number;
}) {
  const { data: users = [], isPending } = useUsers();
  const [userIds, setUserIds] = React.useState<string[]>([]);
  const presetRanges = {
    all: [dayjs('2020-01-01'), dayjs()],
    month: [dayjs().subtract(1, 'month'), dayjs()],
    week: [dayjs().subtract(1, 'week'), dayjs()],
  };

  const [preset, setPreset] = React.useState<'all' | 'month' | 'week' | null>('all');
  const [range, setRange] = React.useState<[Dayjs, Dayjs]>(
    presetRanges.all as [Dayjs, Dayjs],
  );

  /**
   * Предустановленные диапазоны дат.
   * all   – с 01.01.2020 по сегодня
   * month – за последний месяц
   * week  – за последнюю неделю
   */
  const presets = presetRanges;

  const period = React.useMemo(
    () => [
      range[0].startOf('day').toISOString(),
      range[1].endOf('day').toISOString(),
    ] as [string, string],
    [range],
  );

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const byProject =
        !projectIds?.length ||
        u.project_ids.some((pid) => projectIds.includes(pid));
      return byProject;
    });
  }, [users, projectIds]);

  // Используем оптимизированную версию для устранения N+1 проблемы
  const { data, isPending: loadingStats, isError, error } = useMultipleUserStatsOptimized(
    userIds,
    period,
  );

  const userOptions = filteredUsers.map((u) => ({
    value: u.id,
    label: u.name ?? u.email,
  }));


  React.useEffect(() => {
    setUserIds((ids) => ids.filter((id) => filteredUsers.some((u) => u.id === id)));
  }, [filteredUsers]);

  React.useEffect(() => {
    setUserIds([]);
    setRange(presetRanges.all as [Dayjs, Dayjs]);
    setPreset('all');
  }, [resetSignal]);

  const tableData = React.useMemo(
    () =>
      userIds.map((id, idx) => {
        const stats = data?.[idx];
        const u = filteredUsers.find((f) => f.id === id);
        
        
        return {
          key: id,
          name: u?.name ?? u?.email ?? id,
          claim: stats?.claimCount ?? 0,
          claimResp: stats?.claimResponsibleCount ?? 0,
          defect: stats?.defectCount ?? 0,
          defectResp: stats?.defectResponsibleCount ?? 0,
          claimStatusCounts: stats?.claimStatusCounts ?? [],
          claimResponsibleStatusCounts: stats?.claimResponsibleStatusCounts ?? [],
          defectStatusCounts: stats?.defectStatusCounts ?? [],
          defectResponsibleStatusCounts: stats?.defectResponsibleStatusCounts ?? [],
        };
      }),
    [userIds, data, filteredUsers],
  );

  const totals = React.useMemo(
    () =>
      tableData.reduce(
        (acc, row) => {
          acc.claim += row.claim;
          acc.claimResp += row.claimResp;
          acc.defect += row.defect;
          acc.defectResp += row.defectResp;
          return acc;
        },
        {
          claim: 0,
          claimResp: 0,
          defect: 0,
          defectResp: 0,
        },
      ),
    [tableData],
  );

  const columns: ColumnsType<(typeof tableData)[number]> = [
    {
      title: '№',
      dataIndex: 'index',
      width: 60,
      align: 'right',
      render: (_, __, i) => i + 1,
    },
    {
      title: 'Пользователь',
      dataIndex: 'name',
      sorter: (a, b) => String(a.name).localeCompare(String(b.name)),
    },
    {
      title: 'Создано претензий',
      dataIndex: 'claim',
      width: 150,
      align: 'right',
      sorter: (a, b) => a.claim - b.claim,
      render: (v: number) =>
        v
          ? `${v} (${totals.claim ? Math.round((v / totals.claim) * 100) : 0}%)`
          : '—',
    },
    {
      title: 'Претензий за ним',
      dataIndex: 'claimResp',
      width: 150,
      align: 'right',
      sorter: (a, b) => a.claimResp - b.claimResp,
      render: (v: number) =>
        v
          ? `${v} (${
              totals.claimResp ? Math.round((v / totals.claimResp) * 100) : 0
            }%)`
          : '—',
    },
    {
      title: 'Создано дефектов',
      dataIndex: 'defect',
      width: 150,
      align: 'right',
      sorter: (a, b) => a.defect - b.defect,
      render: (v: number) =>
        v
          ? `${v} (${
              totals.defect ? Math.round((v / totals.defect) * 100) : 0
            }%)`
          : '—',
    },
    {
      title: 'Дефектов за ним',
      dataIndex: 'defectResp',
      width: 150,
      align: 'right',
      sorter: (a, b) => a.defectResp - b.defectResp,
      render: (v: number) =>
        v
          ? `${v} (${
              totals.defectResp ? Math.round((v / totals.defectResp) * 100) : 0
            }%)`
          : '—',
    },
  ];

  return (
    <ConfigProvider locale={ruRU}>
      <Card title="Статистика пользователя" style={{ width: 1600 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space style={{ width: '100%' }} direction="vertical">
            <Select
              mode="multiple"
              showSearch
              allowClear
              placeholder="Выберите пользователя"
              options={userOptions}
              optionFilterProp="label"
              value={userIds}
              onChange={(val) => setUserIds(val)}
              loading={isPending}
              style={{ width: '100%' }}
            />
            {filteredUsers.length > 0 && (
              <Button 
                onClick={() => setUserIds(filteredUsers.map(u => u.id))}
                type="link"
                style={{ padding: 0 }}
              >
                Выбрать всех пользователей {projectIds?.length ? 'выбранных проектов' : ''}
              </Button>
            )}
          </Space>
          <Segmented
            options={[
              { label: 'За все время', value: 'all' },
              { label: '1 мес', value: 'month' },
              { label: '1 неделя', value: 'week' },
            ]}
            onChange={(val) => {
              setPreset(val as 'all' | 'month' | 'week');
              setRange(presetRanges[val as 'all' | 'month' | 'week'] as [Dayjs, Dayjs]);
            }}
            value={preset ?? undefined}
            style={{ width: '100%' }}
          />
          <RangePicker
            style={{ width: 260 }}
            value={range}
            onChange={(v) => {
              setPreset(null);
              setRange(v as [Dayjs, Dayjs]);
            }}
            format="DD.MM.YYYY"
          />
          {loadingStats && userIds.length && period ? (
            <Skeleton active paragraph={{ rows: 2 }} />
          ) : null}
          {isError && (
            <Alert
              type="error"
              message="Ошибка загрузки статистики"
              description={error?.message || 'Не удалось загрузить данные статистики пользователей'}
              showIcon
            />
          )}
          {data && userIds.length && !loadingStats && !isError ? (
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              size="small"
              expandable={{
                expandedRowRender: (record) => {
                  // Проверяем, есть ли данные по статусам
                  if (!record.claimStatusCounts?.length && 
                      !record.claimResponsibleStatusCounts?.length && 
                      !record.defectStatusCounts?.length && 
                      !record.defectResponsibleStatusCounts?.length) {
                    return <div style={{ padding: '10px 40px', color: '#999' }}>Нет данных по статусам</div>;
                  }
                  
                  // Создаем карту статусов для объединения данных
                  const statusMap = new Map<string, {
                    statusId: number | null;
                    statusName: string;
                    claimCreated: number;
                    claimResp: number;
                    defectCreated: number;
                    defectResp: number;
                  }>();

                  // Добавляем данные по созданным претензиям
                  record.claimStatusCounts.forEach(item => {
                    const key = item.statusName || 'Без статуса';
                    if (!statusMap.has(key)) {
                      statusMap.set(key, {
                        statusId: item.statusId,
                        statusName: key,
                        claimCreated: 0,
                        claimResp: 0,
                        defectCreated: 0,
                        defectResp: 0,
                      });
                    }
                    // Аккумулируем значения, а не перезаписываем
                    statusMap.get(key)!.claimCreated += item.count;
                  });

                  // Добавляем данные по претензиям за пользователем
                  record.claimResponsibleStatusCounts.forEach(item => {
                    const key = item.statusName || 'Без статуса';
                    if (!statusMap.has(key)) {
                      statusMap.set(key, {
                        statusId: item.statusId,
                        statusName: key,
                        claimCreated: 0,
                        claimResp: 0,
                        defectCreated: 0,
                        defectResp: 0,
                      });
                    }
                    // Аккумулируем значения, а не перезаписываем
                    statusMap.get(key)!.claimResp += item.count;
                  });

                  // Добавляем данные по созданным дефектам
                  record.defectStatusCounts.forEach(item => {
                    const key = item.statusName || 'Без статуса';
                    if (!statusMap.has(key)) {
                      statusMap.set(key, {
                        statusId: item.statusId,
                        statusName: key,
                        claimCreated: 0,
                        claimResp: 0,
                        defectCreated: 0,
                        defectResp: 0,
                      });
                    }
                    // Аккумулируем значения, а не перезаписываем
                    statusMap.get(key)!.defectCreated += item.count;
                  });

                  // Добавляем данные по дефектам за пользователем
                  record.defectResponsibleStatusCounts.forEach(item => {
                    const key = item.statusName || 'Без статуса';
                    if (!statusMap.has(key)) {
                      statusMap.set(key, {
                        statusId: item.statusId,
                        statusName: key,
                        claimCreated: 0,
                        claimResp: 0,
                        defectCreated: 0,
                        defectResp: 0,
                      });
                    }
                    // Аккумулируем значения, а не перезаписываем
                    statusMap.get(key)!.defectResp += item.count;
                  });

                  const statusData = Array.from(statusMap.values()).sort((a, b) => {
                    // Статусы без ID (null) идут в конец
                    if (a.statusId === null && b.statusId === null) return 0;
                    if (a.statusId === null) return 1;
                    if (b.statusId === null) return -1;
                    // Сортировка по ID
                    return a.statusId - b.statusId;
                  });

                  const subColumns: ColumnsType<typeof statusData[0]> = [
                    {
                      title: '',
                      dataIndex: 'index',
                      width: 60,
                      align: 'right',
                    },
                    {
                      title: 'Статус',
                      dataIndex: 'statusName',
                      render: (v) => <span style={{ paddingLeft: 40 }}>{v}</span>,
                    },
                    {
                      title: 'Создано претензий',
                      dataIndex: 'claimCreated',
                      width: 150,
                      align: 'right',
                      render: (v: number) => {
                        if (v === 0) return '—';
                        const percent = record.claim > 0 ? Math.round((v / record.claim) * 100) : 0;
                        return `${v} (${percent}%)`;
                      },
                    },
                    {
                      title: 'Претензий за ним',
                      dataIndex: 'claimResp',
                      width: 150,
                      align: 'right',
                      render: (v: number) => {
                        if (v === 0) return '—';
                        const percent = record.claimResp > 0 ? Math.round((v / record.claimResp) * 100) : 0;
                        return `${v} (${percent}%)`;
                      },
                    },
                    {
                      title: 'Создано дефектов',
                      dataIndex: 'defectCreated',
                      width: 150,
                      align: 'right',
                      render: (v: number) => {
                        if (v === 0) return '—';
                        const percent = record.defect > 0 ? Math.round((v / record.defect) * 100) : 0;
                        return `${v} (${percent}%)`;
                      },
                    },
                    {
                      title: 'Дефектов за ним',
                      dataIndex: 'defectResp',
                      width: 150,
                      align: 'right',
                      render: (v: number) => {
                        if (v === 0) return '—';
                        const percent = record.defectResp > 0 ? Math.round((v / record.defectResp) * 100) : 0;
                        return `${v} (${percent}%)`;
                      },
                    },
                  ];

                  return (
                    <Table
                      columns={subColumns}
                      dataSource={statusData.map((item, idx) => ({ ...item, key: `${record.key}-${idx}` }))}
                      pagination={false}
                      size="small"
                      showHeader={false}
                      style={{ marginLeft: -16, marginRight: -16 }}
                    />
                  );
                },
                rowExpandable: (record) =>
                  record.claimStatusCounts.length > 0 ||
                  record.claimResponsibleStatusCounts.length > 0 ||
                  record.defectStatusCounts.length > 0 ||
                  record.defectResponsibleStatusCounts.length > 0,
              }}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} align="right" />
                  <Table.Summary.Cell index={1}>
                    <strong>Итого</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <strong>{totals.claim || '—'}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <strong>{totals.claimResp || '—'}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <strong>{totals.defect || '—'}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <strong>{totals.defectResp || '—'}</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          ) : null}
        </Space>
      </Card>
    </ConfigProvider>
  );
}
