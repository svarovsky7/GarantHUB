import React, { useEffect, Suspense } from 'react';
import { Card, Typography, Skeleton, Space, Button, Spin } from 'antd';
import { useSnackbar } from 'notistack';
import { useVisibleProjects } from '@/entities/project';
import { useAuthStore } from '@/shared/store/authStore';
import ProjectsMultiSelect from '@/features/project/ProjectsMultiSelect';

// Lazy loading для тяжелых компонентов статистики
const ProjectStatsCard = React.lazy(() => import('@/widgets/ProjectStatsCard'));
const UserStatsBlock = React.lazy(() => import('@/widgets/UserStatsBlock'));

/** Главная страница с инфографикой. */
export default function DashboardPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: projects = [], isPending, error } = useVisibleProjects();
  const profile = useAuthStore((s) => s.profile);
  const [selected, setSelected] = React.useState<number[]>([]);
  const [resetCounter, setResetCounter] = React.useState(0);

  useEffect(() => {
    if (error) enqueueSnackbar('Ошибка загрузки проектов.', { variant: 'error' });
  }, [error, enqueueSnackbar]);

  if (isPending) return <Skeleton active />;

  const handleReset = () => {
    setSelected([]);
    setResetCounter((c) => c + 1);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Button onClick={handleReset} style={{ alignSelf: 'flex-start' }}>
        Сбросить фильтры
      </Button>
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
        <Suspense key={id} fallback={<Spin size="large" style={{ display: 'block', textAlign: 'center', padding: '20px' }} />}>
          <ProjectStatsCard projectId={id} />
        </Suspense>
      ))}

      <Suspense fallback={<Spin size="large" style={{ display: 'block', textAlign: 'center', padding: '20px' }} />}>
        <UserStatsBlock projectIds={selected} resetSignal={resetCounter} />
      </Suspense>
    </Space>
  );
}
