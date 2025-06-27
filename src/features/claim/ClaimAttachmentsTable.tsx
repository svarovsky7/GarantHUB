import React from 'react';
import { Table, Button, Tooltip } from 'antd';
import { DeleteOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { RemoteClaimFile } from '@/shared/types/claimFile';
import type { PreviewFile } from '@/shared/types/previewFile';

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
  /** Открыть предпросмотр файла */
  onPreview?: (file: PreviewFile) => void;
}

interface RowData {
  key: string;
  index: number;
  name: string;
  remote: boolean;
  id?: string;
  path?: string;
  file?: File;
  mime?: string;
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
  onPreview,
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
      mime: f.mime_type,
    })),
    ...newFiles.map((f, idx) => ({
      key: `n-${idx}`,
      index: remoteFiles.length + idx + 1,
      name: f.name,
      remote: false,
      file: f,
      mime: f.type,
    })),
  ];

  if (!rows.length) return null;

  const columns: ColumnsType<RowData> = [
    { title: '№', dataIndex: 'index', width: 60 },
    { title: 'Наименование файла', dataIndex: 'name', width: 200, ellipsis: true },
    {
      title: 'Действия',
      dataIndex: 'actions',
      width: 110,
      render: (_: unknown, row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {row.remote ? (
            <>
              <Tooltip title="Предпросмотр">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={async () => {
                    if (!row.path) return;
                    const url = await getSignedUrl?.(row.path!, '');
                    if (!url) return;
                    onPreview?.({ url, name: row.name, mime: row.mime });
                  }}
                />
              </Tooltip>
              <Tooltip title="Скачать">
                <Button
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={async () => {
                    if (!row.path) return;
                    const url = await getSignedUrl?.(row.path!, row.name);
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
            </>
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
      rowClassName={(row) => (!row.remote ? 'new-row' : '')}
      size="small"
      pagination={false}
      columns={columns}
      dataSource={rows}
      showHeader
      style={{ width: 'fit-content' }}
    />
  );
}
