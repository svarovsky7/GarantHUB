import React from 'react';
import { Typography } from 'antd';

interface CorrespondenceStatsProps {
  total: number;
  closedCount: number;
  openCount: number;
  readyToExport: number;
}

/**
 * Statistics display for correspondence
 */
const CorrespondenceStats: React.FC<CorrespondenceStatsProps> = ({
  total,
  closedCount,
  openCount,
  readyToExport,
}) => {
  return (
    <>
      <Typography.Text style={{ display: 'block', marginTop: 8 }}>
        Всего писем: {total}, из них закрытых: {closedCount} и не закрытых: {openCount}
      </Typography.Text>
      <Typography.Text style={{ display: 'block', marginTop: 4 }}>
        Готовых писем к выгрузке: {readyToExport}
      </Typography.Text>
    </>
  );
};

export default React.memo(CorrespondenceStats);
