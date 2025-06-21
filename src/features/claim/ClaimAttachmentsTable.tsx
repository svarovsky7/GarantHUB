import React from 'react';
import { Table, Button, Tooltip } from 'antd';
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
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
  /** Получить подписанную ссылку для скачивания */
  getSignedUrl?: (path: string, name: string) => Promise<string>;
}

interface RowData {
  key: string;
  index: number;
  name: string;
  size: number | null;
  remote: boolean;
  id?: string;
  path?: string;
  file?: File;
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
  getSignedUrl,
}: ClaimAttachmentsTableProps) {
  const [sizes, setSizes] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    remoteFiles.forEach((f) => {
      const id = String(f.id);
      if (sizes[id] == null && f.size == null) {
        fetch(f.url, { method: 'HEAD' })
          .then((r) => Number(r.headers.get('content-length') || 0))
          .then((s) => setSizes((p) => ({ ...p, [id]: s })))
          .catch(() => {});
      }
    });
  }, [remoteFiles, sizes]);

  const rows: RowData[] = [
    ...remoteFiles.map((f, idx) => ({
      key: `r-${idx}`,
      index: idx + 1,
      name: f.original_name ?? f.name,
      size: f.size ?? sizes[String(f.id)] ?? null,
      remote: true,
      id: String(f.id),
      path: f.path,
    })),
    ...newFiles.map((f, idx) => ({
      key: `n-${idx}`,
      index: remoteFiles.length + idx + 1,
      name: f.name,
      size: f.size,
      remote: false,
      file: f,
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
        <div style={{ display: 'flex', gap: 4 }}>
          {row.remote ? (
            <Tooltip title="Скачать">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={async () => {
                  if (!row.path) return;
                  const url = await getSignedUrl?.(row.path, row.name);
                  if (!url) return;
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = row.name;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Скачать">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                href={URL.createObjectURL(row.file!)}
                download={row.name}
              />
            </Tooltip>
          )}
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
        </div>
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
