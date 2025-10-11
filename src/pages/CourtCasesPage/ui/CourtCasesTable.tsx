import React, { useMemo } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { CourtCaseEnriched } from "../model/useCourtCasesData";

interface CourtCasesTableProps {
  data: CourtCaseEnriched[];
  columns: ColumnsType<CourtCaseEnriched>;
  loading: boolean;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

/**
 * Court cases table with tree structure support
 * Displays cases with parent-child relationships
 */
export function CourtCasesTable({
  data,
  columns,
  loading,
  pageSize,
  onPageSizeChange,
}: CourtCasesTableProps) {
  // Build tree data structure for parent-child cases
  const treeData = useMemo(() => {
    const map = new Map<number, any>();
    const roots: any[] = [];

    data.forEach((c) => {
      const row = { ...c, key: c.id, children: [] as any[] };
      map.set(c.id, row);
    });

    data.forEach((c) => {
      const row = map.get(c.id);
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id).children.push(row);
      } else {
        roots.push(row);
      }
    });

    map.forEach((row) => {
      if (!row.children.length) row.children = undefined;
    });

    return roots;
  }, [data]);

  return (
    <Table
      rowKey="id"
      columns={columns}
      sticky={{ offsetHeader: 80 }}
      dataSource={treeData}
      loading={loading}
      pagination={{
        pageSize,
        showSizeChanger: true,
        onChange: (_p, size) => size && onPageSizeChange(size),
      }}
      size="middle"
      expandable={{
        expandRowByClick: true,
        defaultExpandAllRows: false,
        indentSize: 24,
      }}
      rowClassName={(record) =>
        record.parent_id ? "child-case-row" : "main-case-row"
      }
    />
  );
}
