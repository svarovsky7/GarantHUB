import React from 'react';
import { Table, Button, Tooltip } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { RemoteClaimFile } from '@/shared/types/claimFile';
import { signedUrl } from '@/entities/claim';

interface Props {
  files: RemoteClaimFile[];
}

export default function ClaimAttachmentsList({ files }: Props) {
  if (!files.length) return null;

  const columns = [
    { dataIndex: 'index', width: 40 },
    { dataIndex: 'name', ellipsis: true },
    {
      dataIndex: 'actions',
      width: 40,
      render: (_: unknown, row: any) => (
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
      ),
    },
  ];

  const data = files.map((f, i) => ({
    key: String(f.id),
    index: i + 1,
    name: f.original_name ?? f.name,
    path: f.path,
  }));

  return (
    <Table
      rowKey="key"
      size="small"
      pagination={false}
      columns={columns as any}
      dataSource={data}
      showHeader={false}
    />
  );
}
