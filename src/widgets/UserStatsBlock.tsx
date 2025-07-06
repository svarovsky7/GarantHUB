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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import { useUsers } from '@/entities/user';
import { useRoles } from '@/entities/role';
import { useMultipleUserStats } from '@/shared/hooks/useUserStats';
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
  const { data: roles = [] } = useRoles();
  const [userIds, setUserIds] = React.useState<string[]>([]);
  const [role, setRole] = React.useState<string | null>(null);
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
      const byRole = !role || u.role === role;
      return byProject && byRole;
    });
  }, [users, projectIds, role]);

  const { data, isPending: loadingStats } = useMultipleUserStats(
    userIds,
    period,
  );

  const userOptions = filteredUsers.map((u) => ({
    value: u.id,
    label: u.name ?? u.email,
  }));

  const roleOptions = roles.map((r) => ({ value: r.name, label: r.name }));

  React.useEffect(() => {
    setUserIds((ids) => ids.filter((id) => filteredUsers.some((u) => u.id === id)));
  }, [filteredUsers]);

  React.useEffect(() => {
    setUserIds([]);
    setRange(presetRanges.all as [Dayjs, Dayjs]);
    setPreset('all');
    setRole(null);
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
          caseCount: stats?.courtCaseCount ?? 0,
          caseResp: stats?.courtCaseResponsibleCount ?? 0,
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
          acc.caseCount += row.caseCount;
          acc.caseResp += row.caseResp;
          return acc;
        },
        {
          claim: 0,
          claimResp: 0,
          defect: 0,
          defectResp: 0,
          caseCount: 0,
          caseResp: 0,
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
      align: 'right',
      sorter: (a, b) => a.defectResp - b.defectResp,
      render: (v: number) =>
        v
          ? `${v} (${
              totals.defectResp ? Math.round((v / totals.defectResp) * 100) : 0
            }%)`
          : '—',
    },
    {
      title: 'Создано дел',
      dataIndex: 'caseCount',
      align: 'right',
      sorter: (a, b) => a.caseCount - b.caseCount,
      render: (v: number) =>
        v
          ? `${v} (${
              totals.caseCount ? Math.round((v / totals.caseCount) * 100) : 0
            }%)`
          : '—',
    },
    {
      title: 'Дел за ним',
      dataIndex: 'caseResp',
      align: 'right',
      sorter: (a, b) => a.caseResp - b.caseResp,
      render: (v: number) =>
        v
          ? `${v} (${
              totals.caseResp ? Math.round((v / totals.caseResp) * 100) : 0
            }%)`
          : '—',
    },
  ];

  return (
    <ConfigProvider locale={ruRU}>
      <Card title="Статистика пользователя" style={{ width: 1600 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Select
            allowClear
            placeholder="Роль"
            options={roleOptions}
            value={role ?? undefined}
            onChange={(val) => setRole(val)}
            style={{ width: '100%' }}
          />
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
          {data && userIds.length && !loadingStats ? (
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              size="small"
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} />
                  <Table.Summary.Cell index={1}>Итого</Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    {totals.claim || '—'}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    {totals.claimResp || '—'}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    {totals.defect || '—'}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    {totals.defectResp || '—'}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} align="right">
                    {totals.caseCount || '—'}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} align="right">
                    {totals.caseResp || '—'}
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
