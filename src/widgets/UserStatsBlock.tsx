import React from 'react';
import dayjs from 'dayjs';
import {
  ConfigProvider,
  Card,
  Select,
  DatePicker,
  Space,
  Skeleton,
  Statistic,
  Segmented,
} from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useUsers } from '@/entities/user';
import { useMultipleUserStats } from '@/shared/hooks/useUserStats';
import { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

/**
 * Блок статистики по выбранному пользователю и периоду.
 */
dayjs.locale('ru');

export default function UserStatsBlock({
  projectIds,
}: {
  projectIds?: number[];
}) {
  const { data: users = [], isPending } = useUsers();
  const [userIds, setUserIds] = React.useState<string[]>([]);
  const [range, setRange] = React.useState<[Dayjs, Dayjs] | null>(null);
  /** Выбранный предустановленный период. */
  const [preset, setPreset] = React.useState<'all' | 'month' | 'week' | null>(
    null,
  );

  /**
   * Предустановленные диапазоны дат.
   * all   – с 01.01.2020 по сегодня
   * month – за последний месяц
   * week  – за последнюю неделю
   */
  const presets = React.useMemo(
    () => ({
      all: [dayjs('2020-01-01'), dayjs()],
      month: [dayjs().subtract(1, 'month'), dayjs()],
      week: [dayjs().subtract(1, 'week'), dayjs()],
    }),
    [],
  );

  const period = React.useMemo(() => {
    if (!range) return null;
    return [
      range[0].startOf('day').toISOString(),
      range[1].endOf('day').toISOString(),
    ] as [string, string];
  }, [range]);

  const filteredUsers = React.useMemo(() => {
    if (!projectIds?.length) return users;
    return users.filter((u) =>
      u.project_ids.some((pid) => projectIds.includes(pid)),
    );
  }, [users, projectIds]);

  const { data, isPending: loadingStats } = useMultipleUserStats(
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

  return (
    <ConfigProvider locale={ruRU}>
      <Card title="Статистика пользователя" style={{ width: '100%' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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
              setRange(presets[val as 'all' | 'month' | 'week']);
            }}
            value={preset ?? undefined}
            style={{ width: '100%' }}
          />
          <RangePicker
            style={{ width: '100%' }}
            value={range ?? undefined}
            onChange={(v) => {
              setPreset(null);
              setRange(v as [Dayjs, Dayjs] | null);
            }}
            format="DD.MM.YYYY"
          />
          {loadingStats && userIds.length && period ? (
            <Skeleton active paragraph={{ rows: 2 }} />
          ) : null}
          {data && userIds.length && !loadingStats ? (
            <table className="ant-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Создано претензий</th>
                  <th>Претензий за ним</th>
                  <th>Создано дефектов</th>
                  <th>Дефектов за ним</th>
                  <th>Создано дел</th>
                  <th>Дел за ним</th>
                </tr>
              </thead>
              <tbody>
                {userIds.map((id, idx) => {
                  const stats = data[idx];
                  const u = filteredUsers.find((f) => f.id === id);
                  return (
                    <tr key={id}>
                      <td>{u?.name ?? u?.email ?? id}</td>
                      <td>{stats?.claimCount ?? 0}</td>
                      <td>{stats?.claimResponsibleCount ?? 0}</td>
                      <td>{stats?.defectCount ?? 0}</td>
                      <td>{stats?.defectResponsibleCount ?? 0}</td>
                      <td>{stats?.courtCaseCount ?? 0}</td>
                      <td>{stats?.courtCaseResponsibleCount ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
        </Space>
      </Card>
    </ConfigProvider>
  );
}
