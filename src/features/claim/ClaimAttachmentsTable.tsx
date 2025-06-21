import React from 'react';
import { Table, Button, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { RemoteClaimFile } from '@/shared/types/claimFile';

/**
 * Props for {@link ClaimAttachmentsTable}
 */
export interface ClaimAttachmentsTableProps {
  /** Files already uploaded to the server */
  remoteFiles?: RemoteClaimFile[];
  /** Files selected locally */
  newFiles?: File[];
  /** Remove a remote file */
  onRemoveRemote?: (id: string) => void;
  /** Remove a local file */
  onRemoveNew?: (idx: number) => void;
}

interface RowData {
  key: string;
  index: number;
  name: string;
  size: number | null;
  remote: boolean;
  id?: string;
}

/**
 * Compact table displaying attachments of a claim.
 * Numbers files and shows size in MB.
 */
export default function ClaimAttachmentsTable({
  remoteFiles = [],
  newFiles = [],
  onRemoveRemote,
  onRemoveNew,
}: ClaimAttachmentsTableProps) {
  const rows: RowData[] = [
    ...remoteFiles.map((f, idx) => ({
      key: `r-${idx}`,
      index: idx + 1,
      name: f.original_name ?? f.name,
      size: null,
      remote: true,
      id: String(f.id),
    })),
    ...newFiles.map((f, idx) => ({
      key: `n-${idx}`,
      index: remoteFiles.length + idx + 1,
      name: f.name,
      size: f.size,
      remote: false,
    })),
  ];

  if (!rows.length) return null;

  const columns: ColumnsType<RowData> = [
    { dataIndex: 'index', width: 40 },
    { dataIndex: 'name', width: 200, ellipsis: true },
    {
      dataIndex: 'size',
      width: 80,
      render: (s: number | null) =>
        s != null ? (s / 1024 / 1024).toFixed(2) : '—',
    },
    {
      dataIndex: 'actions',
      width: 40,
      render: (_: unknown, row) => (
        <Tooltip title="Удалить">
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              if (row.remote) row.id && onRemoveRemote?.(row.id);
              else onRemoveNew?.(Number(row.key.split('-')[1]));
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Table
      rowKey="key"
      size="small"
      pagination={false}
      columns={columns}
      dataSource={rows}
      showHeader={false}
    />
  );
}
