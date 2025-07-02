import React, { useEffect } from 'react';
import { Card, Typography, Skeleton, Space } from 'antd';
import { useSnackbar } from 'notistack';
import { useVisibleProjects } from '@/entities/project';
import { useAuthStore } from '@/shared/store/authStore';
import ProjectsMultiSelect from '@/features/project/ProjectsMultiSelect';
import ProjectStatsCard from '@/widgets/ProjectStatsCard';

/** Главная страница с инфографикой. */
export default function DashboardPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: projects = [], isPending, error } = useVisibleProjects();
  const profile = useAuthStore((s) => s.profile);
  const [selected, setSelected] = React.useState<number[]>([]);

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

      <Card title="Выбор проектов">
        <ProjectsMultiSelect value={selected} onChange={setSelected} />
      </Card>

      {selected.map((id) => (
        <ProjectStatsCard key={id} projectId={id} />
      ))}
    </Space>
  );
}
