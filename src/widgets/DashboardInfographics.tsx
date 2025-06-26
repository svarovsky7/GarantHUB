import React from 'react';
import { Card, Row, Col, Statistic, Skeleton } from 'antd';
import { Column } from '@ant-design/plots';
import { useDashboardStats } from '@/shared/hooks/useDashboardStats';

/**
 * Инфографика дашборда с динамическими графиками.
 */
export default function DashboardInfographics() {
  const { data, isPending } = useDashboardStats();

  if (isPending || !data) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  const unitData = data.projects.map((p) => ({ project: p.projectName, count: p.unitCount }));
  const defectData = data.projects.map((p) => ({ project: p.projectName, count: p.defectTotal }));
  const letterData = data.projects.map((p) => ({ project: p.projectName, count: p.letterCount }));

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="Открытых претензий" value={data.claimsOpen} />
            </Col>
            <Col span={6}>
              <Statistic title="Закрытых претензий" value={data.claimsClosed} />
            </Col>
            <Col span={6}>
              <Statistic title="Открытых дефектов" value={data.defectsOpen} />
            </Col>
            <Col span={6}>
              <Statistic title="Закрытых дефектов" value={data.defectsClosed} />
            </Col>
          </Row>
        </Card>
      </Col>
      <Col span={8}>
        <Card title="Объекты по проектам">
          <Column data={unitData} xField="project" yField="count" height={200} />
        </Card>
      </Col>
      <Col span={8}>
        <Card title="Дефекты по проектам">
          <Column data={defectData} xField="project" yField="count" height={200} />
        </Card>
      </Col>
      <Col span={8}>
        <Card title="Письма по проектам">
          <Column data={letterData} xField="project" yField="count" height={200} />
        </Card>
      </Col>
      <Col span={24}>
        <Card>
          <Statistic title="Судебных дел" value={data.courtCases} />
        </Card>
      </Col>
    </Row>
  );
}
