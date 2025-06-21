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
  remote: boolean;
  id?: string;
  path?: string;
  file?: File;
}

/**
 * Компактная таблица вложений претензии.
 * Показывает порядковый номер и название файла.
 */
export default function ClaimAttachmentsTable({
  remoteFiles = [],
  newFiles = [],
  onRemoveRemote,
  onRemoveNew,
  getSignedUrl,
}: ClaimAttachmentsTableProps) {
  // размеры файлов для отображения не используются

  const rows: RowData[] = [
    ...remoteFiles.map((f, idx) => ({
      key: `r-${idx}`,
      index: idx + 1,
      name: f.original_name ?? f.name,
      remote: true,
      id: String(f.id),
      path: f.path,
    })),
    ...newFiles.map((f, idx) => ({
      key: `n-${idx}`,
      index: remoteFiles.length + idx + 1,
      name: f.name,
      remote: false,
      file: f,
    })),
  ];

  if (!rows.length) return null;

  const columns: ColumnsType<RowData> = [
    { dataIndex: 'index', width: 40 },
    { dataIndex: 'name', width: 200, ellipsis: true },
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
