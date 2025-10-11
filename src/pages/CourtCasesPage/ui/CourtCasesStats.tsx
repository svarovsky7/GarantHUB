import React from "react";
import { Typography } from "antd";

interface CourtCasesStatsProps {
  total: number;
  closedCount: number;
  openCount: number;
  readyToExport: number;
}

/**
 * Statistics display for court cases
 * Shows total, closed, open, and export-ready case counts
 */
export function CourtCasesStats({
  total,
  closedCount,
  openCount,
  readyToExport,
}: CourtCasesStatsProps) {
  return (
    <>
      <Typography.Text style={{ display: "block", marginTop: 8 }}>
        Всего дел: {total}, из них закрытых: {closedCount} и не закрытых:{" "}
        {openCount}
      </Typography.Text>
      <Typography.Text style={{ display: "block", marginTop: 4 }}>
        Готовых дел к выгрузке: {readyToExport}
      </Typography.Text>
    </>
  );
}
