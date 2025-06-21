import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Tooltip, Space, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

export interface RemoteFile {
  id: string;
  name: string;
  path: string;
  size?: number;
  mime?: string;
}

export interface NewFile {
  file: File;
  mime?: string;
}

interface Props {
  remoteFiles?: RemoteFile[];
  newFiles?: NewFile[];
  onRemoveRemote?: (id: string) => Promise<void> | void;
  onRemoveNew?: (idx: number) => void;
  getSignedUrl?: (path: string, name: string) => Promise<string>;
  loading?: boolean;
}

export default function FileUploadTable({
  remoteFiles = [],
  newFiles = [],
  onRemoveRemote,
  onRemoveNew,
  getSignedUrl,
  loading = false,
}: Props) {
  const [cache, setCache] = useState<Record<string, string>>({});
  const [localRemote, setLocalRemote] = useState(remoteFiles);

  useEffect(() => setLocalRemote(remoteFiles), [remoteFiles]);

  const signed = async (path: string, name: string, id: string) => {
    if (cache[id]) return cache[id];
    const url = await getSignedUrl?.(path, name);
    if (url) setCache((p) => ({ ...p, [id]: url }));
    return url;
  };

  const objUrls = useMemo(() => newFiles.map((f) => URL.createObjectURL(f.file)), [newFiles]);
  useEffect(() => () => objUrls.forEach(URL.revokeObjectURL), [objUrls]);

  const handleRemoveRemote = async (id: string) => {
    const current = localRemote;
    setLocalRemote((p) => p.filter((f) => String(f.id) !== id));
    try {
      await onRemoveRemote?.(id);
    } catch (e) {
      setLocalRemote(current);
    }
  };

  if (!localRemote.length && !newFiles.length) return null;

  interface Row {
    key: string;
    id?: string;
    name: string;
    size?: number;
    file?: File;
    path?: string;
    isRemote: boolean;
  }

  const data: Row[] = [
    ...localRemote.map<Row>((f) => ({
      key: `r-${f.id}`,
      id: f.id,
      name: f.name,
      size: f.size,
      path: f.path,
      isRemote: true,
    })),
    ...newFiles.map<Row>((f, i) => ({
      key: `n-${i}`,
      name: f.file.name,
      size: f.file.size,
      file: f.file,
      isRemote: false,
    })),
  ];

  const columns: ColumnsType<Row> = [
    {
      dataIndex: 'name',
      title: 'Имя',
      render: (_: unknown, row) => {
        const size = row.size != null ? ` (${Math.round(row.size / 1024)} KB)` : '';
        if (row.isRemote) {
          return (
            <span>
              <FileOutlined /> {row.name}
              {size}
            </span>
          );
        }
        return (
          <span>
            <FileOutlined /> {row.name}
            {size}
          </span>
        );
      },
    },
    {
      title: 'Действия',
      dataIndex: 'actions',
      align: 'center',
      width: 100,
      render: (_: unknown, row) => {
        const idx = row.isRemote ? null : Number(row.key.split('-')[1]);
        return (
          <Space>
            <Tooltip title="Скачать">
              {row.isRemote ? (
                <Button
                  type="text"
                  size="small"
                  aria-label="Скачать файл"
                  icon={<DownloadOutlined />}
                  onClick={async () => {
                    if (!row.path || !row.id) return;
                    const url = await signed(row.path, row.name, row.id);
                    if (!url) return;
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = row.name;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  }}
                />
              ) : (
                <Button
                  type="text"
                  size="small"
                  aria-label="Скачать файл"
                  icon={<DownloadOutlined />}
                  href={objUrls[idx as number]}
                  download={row.name}
                />
              )}
            </Tooltip>
            <Tooltip title="Удалить">
              <Popconfirm
                title="Удалить файл?"
                okText="Да"
                cancelText="Нет"
                onConfirm={() => {
                  if (row.isRemote && row.id) handleRemoveRemote(row.id);
                  else if (onRemoveNew) onRemoveNew(idx as number);
                }}
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  aria-label="Удалить файл"
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return <Table rowKey="key" size="small" pagination={false} columns={columns} dataSource={data} loading={loading} />;
}
