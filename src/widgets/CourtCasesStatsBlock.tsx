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
  Segmented,
  Alert,
  Button,
  Row,
  Col,
  Statistic,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import { useUsers } from '@/entities/user';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

dayjs.locale('ru');

interface CourtCaseUserStats {
  userId: string;
  userName: string;
  createdCount: number;
  responsibleCount: number;
  statusCounts: Array<{
    statusId: number | null;
    statusName: string | null;
    count: number;
    type: 'created' | 'responsible';
  }>;
}

interface Props {
  projectIds?: number[];
  resetSignal?: number;
}

export default function CourtCasesStatsBlock({ projectIds, resetSignal = 0 }: Props) {
  const { data: users = [], isPending: usersLoading } = useUsers();
  const { data: statuses = [] } = useCourtCaseStatuses();
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

  const userOptions = filteredUsers.map((u) => ({
    value: u.id,
    label: u.name ?? u.email,
  }));

  // Получение статистики по судебным делам
  const { data: stats, isPending: statsLoading, isError, error } = useQuery<CourtCaseUserStats[]>({
    queryKey: ['court-cases-user-stats', userIds, period, projectIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const [from, to] = period;
      
      // Базовый запрос
      let createdQuery = supabase
        .from('court_cases')
        .select('id, status, created_by, created_at')
        .gte('created_at', from)
        .lte('created_at', to);
        
      let responsibleQuery = supabase
        .from('court_cases')
        .select('id, status, responsible_lawyer_id, created_at')
        .gte('created_at', from)
        .lte('created_at', to);
      
      // Фильтр по проектам если указаны
      if (projectIds && projectIds.length > 0) {
        createdQuery = createdQuery.in('project_id', projectIds);
        responsibleQuery = responsibleQuery.in('project_id', projectIds);
      }
      
      // Фильтр по пользователям
      createdQuery = createdQuery.in('created_by', userIds);
      responsibleQuery = responsibleQuery.in('responsible_lawyer_id', userIds);
      
      const [{ data: createdData }, { data: responsibleData }] = await Promise.all([
        createdQuery,
        responsibleQuery,
      ]);
      
      // Обработка данных для каждого пользователя
      return userIds.map(userId => {
        const user = filteredUsers.find(u => u.id === userId);
        const userCreated = createdData?.filter(c => c.created_by === userId) || [];
        const userResponsible = responsibleData?.filter(c => c.responsible_lawyer_id === userId) || [];
        
        // Подсчет по статусам для созданных дел
        const createdStatusMap = new Map<number | null, number>();
        userCreated.forEach(c => {
          const statusId = c.status ?? null;
          createdStatusMap.set(statusId, (createdStatusMap.get(statusId) || 0) + 1);
        });
        
        // Подсчет по статусам для дел в ответственности
        const responsibleStatusMap = new Map<number | null, number>();
        userResponsible.forEach(c => {
          const statusId = c.status ?? null;
          responsibleStatusMap.set(statusId, (responsibleStatusMap.get(statusId) || 0) + 1);
        });
        
        // Формирование массива статусов
        const statusCounts: Array<{
          statusId: number | null;
          statusName: string | null;
          count: number;
          type: 'created' | 'responsible';
        }> = [];
        
        // Добавляем статусы созданных дел
        createdStatusMap.forEach((count, statusId) => {
          const status = statuses.find(s => s.id === statusId);
          statusCounts.push({
            statusId,
            statusName: status?.name ?? (statusId ? `Статус ${statusId}` : 'Без статуса'),
            count,
            type: 'created',
          });
        });
        
        // Добавляем статусы дел в ответственности
        responsibleStatusMap.forEach((count, statusId) => {
          const status = statuses.find(s => s.id === statusId);
          statusCounts.push({
            statusId,
            statusName: status?.name ?? (statusId ? `Статус ${statusId}` : 'Без статуса'),
            count,
            type: 'responsible',
          });
        });
        
        return {
          userId,
          userName: user?.name ?? user?.email ?? userId,
          createdCount: userCreated.length,
          responsibleCount: userResponsible.length,
          statusCounts,
        };
      });
    },
    staleTime: 60_000,
  });

  // Общая статистика
  const { data: generalStats, isPending: generalStatsLoading } = useQuery({
    queryKey: ['court-cases-general-stats', period, projectIds],
    queryFn: async () => {
      const [from, to] = period;
      
      let query = supabase
        .from('court_cases')
        .select('id, status, created_at, created_by')
        .gte('created_at', from)
        .lte('created_at', to);
      
      if (projectIds && projectIds.length > 0) {
        query = query.in('project_id', projectIds);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Подсчет по статусам
      const statusMap = new Map<number | null, number>();
      const userMap = new Map<string, number>();
      
      (data || []).forEach(c => {
        // По статусам
        const statusId = c.status ?? null;
        statusMap.set(statusId, (statusMap.get(statusId) || 0) + 1);
        
        // По пользователям
        if (c.created_by) {
          userMap.set(c.created_by, (userMap.get(c.created_by) || 0) + 1);
        }
      });
      
      return {
        total: data?.length || 0,
        byStatus: Array.from(statusMap.entries()).map(([statusId, count]) => {
          const status = statuses.find(s => s.id === statusId);
          return {
            statusId,
            statusName: status?.name ?? (statusId ? `Статус ${statusId}` : 'Без статуса'),
            statusColor: status?.color,
            count,
          };
        }).sort((a, b) => (a.statusId ?? 0) - (b.statusId ?? 0)),
        byUser: Array.from(userMap.entries())
          .map(([userId, count]) => {
            const user = users.find(u => u.id === userId);
            return {
              userId,
              userName: user?.name ?? user?.email ?? 'Неизвестный',
              count,
            };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 10), // Топ-10 пользователей
      };
    },
    staleTime: 60_000,
  });

  React.useEffect(() => {
    setUserIds([]);
    setRange(presetRanges.all as [Dayjs, Dayjs]);
    setPreset('all');
  }, [resetSignal]);

  React.useEffect(() => {
    setUserIds((ids) => ids.filter((id) => filteredUsers.some((u) => u.id === id)));
  }, [filteredUsers]);

  const columns: ColumnsType<CourtCaseUserStats> = [
    {
      title: '№',
      width: 60,
      align: 'right',
      render: (_, __, i) => i + 1,
    },
    {
      title: 'Пользователь',
      dataIndex: 'userName',
      sorter: (a, b) => a.userName.localeCompare(b.userName),
    },
    {
      title: 'Создано дел',
      dataIndex: 'createdCount',
      width: 150,
      align: 'right',
      sorter: (a, b) => a.createdCount - b.createdCount,
      render: (v: number) => {
        if (v === 0) return '—';
        const total = stats?.reduce((sum, s) => sum + s.createdCount, 0) || 0;
        const percent = total > 0 ? Math.round((v / total) * 100) : 0;
        return `${v} (${percent}%)`;
      },
    },
    {
      title: 'Ответственный юрист',
      dataIndex: 'responsibleCount',
      width: 180,
      align: 'right',
      sorter: (a, b) => a.responsibleCount - b.responsibleCount,
      render: (v: number) => {
        if (v === 0) return '—';
        const total = stats?.reduce((sum, s) => sum + s.responsibleCount, 0) || 0;
        const percent = total > 0 ? Math.round((v / total) * 100) : 0;
        return `${v} (${percent}%)`;
      },
    },
  ];

  const totals = React.useMemo(() => {
    if (!stats) return { created: 0, responsible: 0 };
    return stats.reduce(
      (acc, s) => ({
        created: acc.created + s.createdCount,
        responsible: acc.responsible + s.responsibleCount,
      }),
      { created: 0, responsible: 0 },
    );
  }, [stats]);

  return (
    <ConfigProvider locale={ruRU}>
      <Card title="Статистика по судебным делам" style={{ width: 1600 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Общая статистика */}
          {generalStatsLoading ? (
            <Skeleton active />
          ) : generalStats ? (
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Всего судебных дел" 
                    value={generalStats.total} 
                  />
                </Card>
              </Col>
              <Col span={18}>
                <Card title="По статусам">
                  <Row gutter={[16, 16]}>
                    {generalStats.byStatus.map(status => (
                      <Col span={6} key={status.statusId ?? 'null'}>
                        <Statistic
                          title={
                            <span style={{ color: status.statusColor }}>
                              {status.statusName}
                            </span>
                          }
                          value={status.count}
                          suffix={`(${generalStats.total > 0 ? Math.round((status.count / generalStats.total) * 100) : 0}%)`}
                        />
                      </Col>
                    ))}
                  </Row>
                </Card>
              </Col>
              {generalStats.byUser.length > 0 && (
                <Col span={24}>
                  <Card title="Топ-10 пользователей по созданным делам">
                    <Row gutter={[16, 16]}>
                      {generalStats.byUser.map((user, idx) => (
                        <Col span={6} key={user.userId}>
                          <Statistic
                            title={`${idx + 1}. ${user.userName}`}
                            value={user.count}
                            suffix={`(${generalStats.total > 0 ? Math.round((user.count / generalStats.total) * 100) : 0}%)`}
                          />
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>
              )}
            </Row>
          ) : null}

          {/* Детальная статистика по пользователям */}
          <Space style={{ width: '100%' }} direction="vertical">
            <Select
              mode="multiple"
              showSearch
              allowClear
              placeholder="Выберите пользователей для детальной статистики"
              options={userOptions}
              optionFilterProp="label"
              value={userIds}
              onChange={(val) => setUserIds(val)}
              loading={usersLoading}
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
              { label: '1 месяц', value: 'month' },
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

          {statsLoading && userIds.length > 0 ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : null}

          {isError && (
            <Alert
              type="error"
              message="Ошибка загрузки статистики"
              description={error?.message || 'Не удалось загрузить данные статистики по судебным делам'}
              showIcon
            />
          )}

          {stats && stats.length > 0 && !statsLoading && !isError ? (
            <Table
              columns={columns}
              dataSource={stats}
              rowKey="userId"
              pagination={false}
              size="small"
              expandable={{
                expandedRowRender: (record) => {
                  if (!record.statusCounts.length) {
                    return <div style={{ padding: '10px 40px', color: '#999' }}>Нет данных по статусам</div>;
                  }

                  // Группируем по статусам
                  const statusMap = new Map<string, { created: number; responsible: number }>();
                  record.statusCounts.forEach(item => {
                    const key = item.statusName || 'Без статуса';
                    if (!statusMap.has(key)) {
                      statusMap.set(key, { created: 0, responsible: 0 });
                    }
                    const entry = statusMap.get(key)!;
                    if (item.type === 'created') {
                      entry.created += item.count;
                    } else {
                      entry.responsible += item.count;
                    }
                  });

                  const statusData = Array.from(statusMap.entries()).map(([statusName, counts]) => ({
                    statusName,
                    ...counts,
                  }));

                  const subColumns: ColumnsType<typeof statusData[0]> = [
                    {
                      title: 'Статус',
                      dataIndex: 'statusName',
                      render: (v) => <span style={{ paddingLeft: 40 }}>{v}</span>,
                    },
                    {
                      title: 'Создано дел',
                      dataIndex: 'created',
                      width: 150,
                      align: 'right',
                      render: (v: number) => {
                        if (v === 0) return '—';
                        const percent = record.createdCount > 0 ? Math.round((v / record.createdCount) * 100) : 0;
                        return `${v} (${percent}%)`;
                      },
                    },
                    {
                      title: 'Ответственный юрист',
                      dataIndex: 'responsible',
                      width: 180,
                      align: 'right',
                      render: (v: number) => {
                        if (v === 0) return '—';
                        const percent = record.responsibleCount > 0 ? Math.round((v / record.responsibleCount) * 100) : 0;
                        return `${v} (${percent}%)`;
                      },
                    },
                  ];

                  return (
                    <Table
                      columns={subColumns}
                      dataSource={statusData}
                      rowKey="statusName"
                      pagination={false}
                      size="small"
                      showHeader={false}
                      style={{ marginLeft: -16, marginRight: -16 }}
                    />
                  );
                },
                rowExpandable: (record) => record.statusCounts.length > 0,
              }}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} align="right" />
                  <Table.Summary.Cell index={1}>
                    <strong>Итого</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <strong>{totals.created || '—'}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <strong>{totals.responsible || '—'}</strong>
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