import React from 'react';
import { Table, Button, Tooltip } from 'antd';
import { FileOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useDefectFiles, signedUrl, useRemoveDefectAttachment } from '@/entities/defect';
import type { RemoteDefectFile } from '@/shared/types/defectFile';

interface Props {
  defectId: number;
  expanded: boolean;
}

export default function DefectFilesRow({ defectId, expanded }: Props) {
  const { data = [], isLoading } = useDefectFiles(defectId, { enabled: expanded });
  const remove = useRemoveDefectAttachment();

  const rows = data.map((f) => ({
    key: String(f.id),
    id: String(f.id),
    name: f.original_name ?? f.name,
    path: f.path,
    mime: f.mime_type,
  }));

  const handleRemove = async (id: string) => {
    await remove.mutateAsync({ defectId, attachmentId: Number(id) });
  };

  const columns: ColumnsType<typeof rows[0]> = [
    { dataIndex: 'icon', width: 32, render: () => <FileOutlined /> },
    { title: 'Имя', dataIndex: 'name', width: 200, ellipsis: true },
    {
      title: 'Действия',
      dataIndex: 'actions',
      width: 100,
      render: (_: any, row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Tooltip title="Скачать">
            <Button
              type="text"
              size="small"
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
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemove(row.id)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <Table
      rowKey="key"
      columns={columns}
      dataSource={rows}
      size="small"
      pagination={false}
      loading={isLoading}
      showHeader={false}
      style={{ width: 'fit-content' }}
    />
  );
}
