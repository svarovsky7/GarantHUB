import React from 'react';
import { Card, Row, Col, Statistic, Skeleton, Alert } from 'antd';
import { useDashboardStats } from '@/shared/hooks/useDashboardStats';
import { useVisibleProjects } from '@/entities/project';

interface Props {
  projectId: number | 'all';
  allProjects?: number[];
}

/**
 * Карточка статистики выбранного проекта.
 */
export default function ProjectStatsCard({ projectId, allProjects }: Props) {
  const isAllProjects = projectId === 'all';
  const { data, isPending, isError, error } = useDashboardStats(
    isAllProjects && allProjects ? allProjects : projectId as number
  );
  const { data: projects = [] } = useVisibleProjects();
  const name = isAllProjects 
    ? 'Все проекты' 
    : projects.find((p) => p.id === projectId)?.name || 'Проект';

  if (isPending) {
    return (
      <Card title={name} style={{ width: '100%' }}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card title={name} style={{ width: '100%' }}>
        <Alert
          type="error"
          message="Ошибка загрузки статистики проекта"
          description={error?.message || 'Не удалось загрузить данные'}
          showIcon
        />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card title={name} style={{ width: '100%' }}>
        <Alert
          type="warning"
          message="Нет данных"
          description="Статистика проекта недоступна"
          showIcon
        />
      </Card>
    );
  }

  // Type assertion для TypeScript
  const statsData = data as import('@/shared/types/dashboardStats').DashboardStats;

  const totalUnits = statsData.projects.reduce((sum, p) => sum + (p?.unitCount ?? 0), 0);
  const totalBuildings = statsData.projects.reduce((sum, p) => sum + (p?.buildingCount ?? 0), 0);
  const totalLetters = statsData.projects.reduce((sum, p) => sum + (p?.letterCount ?? 0), 0);

  return (
    <Card title={name} style={{ width: '100%' }}>
      <Row gutter={16}>
        <Col span={8}>
          <Statistic title="Объекты" value={totalUnits} />
        </Col>
        <Col span={8}>
          <Statistic title="Корпусов" value={totalBuildings} />
        </Col>
        <Col span={8}>
          <Statistic title="Откр. претензий" value={statsData.claimsOpen} />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Statistic title="Откр. дефектов" value={statsData.defectsOpen} />
        </Col>
        <Col span={8}>
          <Statistic title="Закр. претензий" value={statsData.claimsClosed} />
        </Col>
        <Col span={8}>
          <Statistic title="Закр. дефектов" value={statsData.defectsClosed} />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Statistic title="Писем" value={totalLetters} />
        </Col>
        <Col span={8}>
          <Statistic title="Откр. судебных дел" value={statsData.courtCasesOpen} />
        </Col>
        <Col span={8}>
          <Statistic title="Закр. судебных дел" value={statsData.courtCasesClosed} />
        </Col>
      </Row>
    </Card>
  );
}
