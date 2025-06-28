import React from 'react';
import { Card, Row, Col, Statistic, Skeleton } from 'antd';
import { useDashboardStats } from '@/shared/hooks/useDashboardStats';
import { useVisibleProjects } from '@/entities/project';

interface Props {
  projectId: number;
}

/**
 * Карточка статистики выбранного проекта.
 */
export default function ProjectStatsCard({ projectId }: Props) {
  const { data, isPending } = useDashboardStats(projectId);
  const { data: projects = [] } = useVisibleProjects();
  const name = projects.find((p) => p.id === projectId)?.name || 'Проект';

  if (isPending || !data) {
    return (
      <Card title={name} style={{ width: '100%' }}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    );
  }

  const prj = data.projects[0];

  return (
    <Card title={name} style={{ width: '100%' }}>
      <Row gutter={16}>
        <Col span={8}>
          <Statistic title="Объекты" value={prj?.unitCount ?? 0} />
        </Col>
        <Col span={8}>
          <Statistic title="Корпусов" value={prj?.buildingCount ?? 0} />
        </Col>
        <Col span={8}>
          <Statistic title="Откр. претензий" value={data.claimsOpen} />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Statistic title="Откр. дефектов" value={data.defectsOpen} />
        </Col>
        <Col span={8}>
          <Statistic title="Закр. претензий" value={data.claimsClosed} />
        </Col>
        <Col span={8}>
          <Statistic title="Закр. дефектов" value={data.defectsClosed} />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Statistic title="Писем" value={prj?.letterCount ?? 0} />
        </Col>
        <Col span={8}>
          <Statistic title="Откр. судебных дел" value={data.courtCasesOpen} />
        </Col>
        <Col span={8}>
          <Statistic title="Закр. судебных дел" value={data.courtCasesClosed} />
        </Col>
      </Row>
    </Card>
  );
}
