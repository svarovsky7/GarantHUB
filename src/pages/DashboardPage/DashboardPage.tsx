import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, Typography, List, Skeleton, Space } from 'antd';
import { useSnackbar } from 'notistack';
import { useVisibleProjects } from '@/entities/project';
import { useAuthStore } from '@/shared/store/authStore';
import DashboardInfographics from '@/widgets/DashboardInfographics';

/** Главная страница с инфографикой. */
export default function DashboardPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: projects = [], isPending, error } = useVisibleProjects();
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (error) enqueueSnackbar('Ошибка загрузки проектов.', { variant: 'error' });
  }, [error, enqueueSnackbar]);

  if (isPending) return <Skeleton active />;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Добро пожаловать, {profile?.name ?? profile?.email ?? 'гость'}!
        </Typography.Title>
        <Typography.Paragraph>Всего проектов: {projects.length}</Typography.Paragraph>
      </Card>

      <DashboardInfographics />

      <Card title="Список проектов">
        {projects.length === 0 ? (
          <Typography>Проектов пока нет.</Typography>
        ) : (
          <List
            dataSource={projects}
            renderItem={(p) => (
              <List.Item>
                <RouterLink to={`/units?project=${p.id}`}>{p.name}</RouterLink>
              </List.Item>
            )}
          />
        )}
      </Card>
    </Space>
  );
}
