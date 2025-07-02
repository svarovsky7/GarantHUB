import React from 'react';
import dayjs from 'dayjs';
import { ConfigProvider, Card, Select, DatePicker, Space, Skeleton, Statistic } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useUsers } from '@/entities/user';
import { useUserStats } from '@/shared/hooks/useUserStats';
import { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

/**
 * Блок статистики по выбранному пользователю и периоду.
 */
dayjs.locale('ru');

export default function UserStatsBlock() {
  const { data: users = [], isPending } = useUsers();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<[Dayjs, Dayjs] | null>(null);

  const period = React.useMemo(() => {
    if (!range) return null;
    return [
      range[0].startOf('day').toISOString(),
      range[1].endOf('day').toISOString(),
    ] as [string, string];
  }, [range]);

  const { data, isPending: loadingStats } = useUserStats(userId, period);

  const userOptions = users.map((u) => ({
    value: u.id,
    label: u.name ?? u.email,
  }));

  return (
    <ConfigProvider locale={ruRU}>
      <Card title="Статистика пользователя" style={{ maxWidth: 360, margin: 0, width: '100%' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Select
            showSearch
            allowClear
            placeholder="Выберите пользователя"
            options={userOptions}
            value={userId ?? undefined}
            onChange={(val) => setUserId(val)}
            loading={isPending}
            style={{ width: '100%' }}
          />
          <RangePicker
            style={{ width: '100%' }}
            value={range ?? undefined}
            onChange={(v) => setRange(v as [Dayjs, Dayjs] | null)}
            format="DD.MM.YYYY"
          />
          {loadingStats && userId && period ? (
            <Skeleton active paragraph={{ rows: 2 }} />
          ) : null}
          {data && !loadingStats ? (
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Statistic title="Создано замечаний" value={data.claimCount} />
              {data.claimStatusCounts.map((s) => (
                <div
                  key={`c-${s.statusId}`}
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>{s.statusName ?? 'Без статуса'}</span>
                  <span>{s.count}</span>
                </div>
              ))}
              <Statistic title="Создано дефектов" value={data.defectCount} style={{ marginTop: 8 }} />
              {data.defectStatusCounts.map((s) => (
                <div
                  key={`d-${s.statusId}`}
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>{s.statusName ?? 'Без статуса'}</span>
                  <span>{s.count}</span>
                </div>
              ))}
            </Space>
          ) : null}
        </Space>
      </Card>
    </ConfigProvider>
  );
}
