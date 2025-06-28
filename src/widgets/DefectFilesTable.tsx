import React from 'react';
import { Table, Tooltip, Button, Space } from 'antd';
import {
  FileOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileZipOutlined,
  FileTextOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { RemoteDefectFile } from '@/shared/types/defectFile';
import { signedUrl, useRemoveDefectAttachment } from '@/entities/defect';

interface Props {
  defectId: number;
  files: RemoteDefectFile[];
}

const formatSize = (size?: number) => {
  if (!size) return '—';
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / 1024 / 1024).toFixed(1) + ' MB';
};

const iconByMime = (mime?: string) => {
  if (!mime) return <FileOutlined />;
  if (mime.includes('pdf')) return <FilePdfOutlined />;
  if (mime.startsWith('image/')) return <FileImageOutlined />;
  if (mime.includes('zip') || mime.includes('rar')) return <FileZipOutlined />;
  if (mime.includes('text')) return <FileTextOutlined />;
  return <FileOutlined />;
};

export default function DefectFilesTable({ defectId, files }: Props) {
  const remove = useRemoveDefectAttachment();

  const columns: ColumnsType<RemoteDefectFile> = [
    {
      dataIndex: 'icon',
      width: 32,
      render: (_: unknown, row) => iconByMime(row.mime_type),
    },
    { title: 'Имя', dataIndex: 'name', ellipsis: true },
    { title: 'Размер', dataIndex: 'size', width: 100, render: formatSize },
    {
      title: 'Действия',
      dataIndex: 'actions',
      width: 100,
      render: (_: unknown, row) => (
        <Space>
          <Tooltip title="Скачать">
            <Button
              size="small"
              type="text"
              icon={<DownloadOutlined />}
              onClick={async () => {
                const url = await signedUrl(row.path, row.name);
                const a = document.createElement('a');
                a.href = url;
                a.download = row.name;
                document.body.appendChild(a);
                a.click();
                a.remove();
              }}
            />
          </Tooltip>
          <Tooltip title="Удалить">
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() =>
                remove.mutate({ defectId, attachmentId: Number(row.id) })
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      size="small"
      pagination={false}
      columns={columns}
      dataSource={files}
      style={{ marginLeft: 40 }}
      showHeader={false}
    />
  );
}
