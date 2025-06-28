import React from 'react';
import { Card, Row, Col, Statistic, Skeleton, Select } from 'antd';
import { Bar } from '@ant-design/plots';
import { useDashboardStats } from '@/shared/hooks/useDashboardStats';

/**
 * Инфографика дашборда с динамическими графиками.
 */
export default function DashboardInfographics() {
  const { data, isPending } = useDashboardStats();

  const [unitOrder, setUnitOrder] = React.useState<'asc' | 'desc'>('desc');
  const [defectOrder, setDefectOrder] = React.useState<'asc' | 'desc'>('desc');
  const [letterOrder, setLetterOrder] = React.useState<'asc' | 'desc'>('desc');
  const [claimUnitOrder, setClaimUnitOrder] = React.useState<'asc' | 'desc'>('desc');
  const [claimEngOrder, setClaimEngOrder] = React.useState<'asc' | 'desc'>('desc');
  const [defectEngOrder, setDefectEngOrder] = React.useState<'asc' | 'desc'>('desc');

  if (isPending || !data) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  const unitData = data.projects.map((p) => ({ name: p.projectName, count: p.unitCount }));
  const defectData = data.projects.map((p) => ({ name: p.projectName, count: p.defectTotal }));
  const letterData = data.projects.map((p) => ({ name: p.projectName, count: p.letterCount }));

  const sortData = (arr: { name: string; count: number }[], dir: 'asc' | 'desc') =>
    [...arr].sort((a, b) => (dir === 'asc' ? a.count - b.count : b.count - a.count));

  const sortedUnits = sortData(unitData, unitOrder);
  const sortedDefects = sortData(defectData, defectOrder);
  const sortedLetters = sortData(letterData, letterOrder);
  const sortedClaimUnits = sortData(
    (data.claimsByUnit ?? []).map((c) => ({ name: c.unitName, count: c.count })),
    claimUnitOrder,
  );
  const sortedClaimEng = sortData(
    (data.claimsByEngineer ?? []).map((c) => ({ name: c.engineerName, count: c.count })),
    claimEngOrder,
  );
  const sortedDefectEng = sortData(
    (data.defectsByEngineer ?? []).map((c) => ({ name: c.engineerName, count: c.count })),
    defectEngOrder,
  );

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
        <Card title="Объекты по проектам" extra={<Select size="small" value={unitOrder} onChange={setUnitOrder} options={[{value:'desc',label:'По убыв.'},{value:'asc',label:'По возр.'}]} />}> 
          <Bar data={sortedUnits} xField="count" yField="name" height={200} />
        </Card>
      </Col>
      <Col span={8}>
        <Card title="Дефекты по проектам" extra={<Select size="small" value={defectOrder} onChange={setDefectOrder} options={[{value:'desc',label:'По убыв.'},{value:'asc',label:'По возр.'}]} />}> 
          <Bar data={sortedDefects} xField="count" yField="name" height={200} />
        </Card>
      </Col>
      <Col span={8}>
        <Card title="Письма по проектам" extra={<Select size="small" value={letterOrder} onChange={setLetterOrder} options={[{value:'desc',label:'По убыв.'},{value:'asc',label:'По возр.'}]} />}> 
          <Bar data={sortedLetters} xField="count" yField="name" height={200} />
        </Card>
      </Col>
      <Col span={8}>
        <Card title="Претензии по объектам" extra={<Select size="small" value={claimUnitOrder} onChange={setClaimUnitOrder} options={[{value:'desc',label:'По убыв.'},{value:'asc',label:'По возр.'}]} />}> 
          <Bar data={sortedClaimUnits} xField="count" yField="name" height={200} />
        </Card>
      </Col>
      <Col span={8}>
        <Card title="Претензии по инженерам" extra={<Select size="small" value={claimEngOrder} onChange={setClaimEngOrder} options={[{value:'desc',label:'По убыв.'},{value:'asc',label:'По возр.'}]} />}> 
          <Bar data={sortedClaimEng} xField="count" yField="name" height={200} />
        </Card>
      </Col>
      <Col span={8}>
        <Card title="Дефекты по инженерам" extra={<Select size="small" value={defectEngOrder} onChange={setDefectEngOrder} options={[{value:'desc',label:'По убыв.'},{value:'asc',label:'По возр.'}]} />}> 
          <Bar data={sortedDefectEng} xField="count" yField="name" height={200} />
        </Card>
      </Col>
      <Col span={12}>
        <Card>
          <Statistic title="Откр. судебных дел" value={data.courtCasesOpen} />
        </Card>
      </Col>
      <Col span={12}>
        <Card>
          <Statistic title="Закр. судебных дел" value={data.courtCasesClosed} />
        </Card>
      </Col>
    </Row>
  );
}
