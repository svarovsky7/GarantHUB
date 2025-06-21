import React from 'react';
import { Table, Button, Space, Tooltip, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  FileOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from '@ant-design/icons';

interface RemoteFile {
  id: string;
  name: string;
  path: string;
  /** MIME-тип файла */
  mime?: string;
}

interface NewFile {
  file: File;
  mime?: string;
}

interface Props {
  remoteFiles?: RemoteFile[];
  newFiles?: NewFile[];
  onRemoveRemote?: (id: string) => void;
  onRemoveNew?: (idx: number) => void;
  getSignedUrl?: (path: string, name: string) => Promise<string>;
}

/**
 * Таблица редактирования вложений.
 * Исправлено «зачёркивание» значения в Select —
 * теперь каждый `Select` обёрнут в `FormControl` с `InputLabel` и получает prop `label`.
 */
export default function AttachmentEditorTable({
                                                remoteFiles = [],
                                                newFiles = [],
                                                onRemoveRemote,
                                                onRemoveNew,
                                                getSignedUrl,
                                              }: Props) {
  const [cache, setCache] = React.useState<Record<string, string>>({});

  const signed = async (path: string, name: string, id: string) => {
    if (cache[id]) return cache[id];
    const url = await getSignedUrl?.(path, name);
    if (url) setCache((p) => ({ ...p, [id]: url }));
    return url;
  };

  const objUrls = React.useMemo(() => newFiles.map((f) => URL.createObjectURL(f.file)), [newFiles]);
  React.useEffect(() => () => objUrls.forEach(URL.revokeObjectURL), [objUrls]);

  const forceDownload = async (f: RemoteFile) => {
    const url = await signed(f.path, f.name, f.id);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!remoteFiles.length && !newFiles.length) return null;

  interface Row {
    key: string;
    id?: string;
    name: string;
    mime?: string;
    file?: File;
    path?: string;
    isRemote: boolean;
  }

  const data: Row[] = [
    ...remoteFiles.map<Row>((f) => ({
      key: `r-${f.id}`,
      id: f.id,
      name: f.name,
      mime: f.mime,
      path: f.path,
      isRemote: true,
    })),
    ...newFiles.map<Row>((f, i) => ({
      key: `n-${i}`,
      name: f.file.name,
      mime: f.mime,
      file: f.file,
      isRemote: false,
    })),
  ];

  const columns: ColumnsType<Row> = [
    {
      dataIndex: 'icon',
      width: 32,
      render: () => <FileOutlined />,
    },
    {
      title: 'Название',
      dataIndex: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'MIME',
      dataIndex: 'mime',
      width: 200,
    },
    {
      title: 'Действия',
      dataIndex: 'actions',
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
                  icon={<DownloadOutlined />}
                  onClick={() =>
                    row.id &&
                    row.path &&
                    forceDownload({
                      id: row.id,
                      name: row.name,
                      path: row.path,
                      mime: row.mime,
                    })
                  }
                />
              ) : (
                <Button
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  href={objUrls[idx as number]}
                  download={row.name}
                />
              )}
            </Tooltip>
            <Tooltip title="Удалить">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  if (row.isRemote && row.id) onRemoveRemote?.(row.id);
                  else onRemoveNew?.(idx as number);
                }}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="key"
      size="small"
      pagination={false}
      columns={columns}
      dataSource={data}
      showHeader={false}
      style={{ width: 'fit-content', marginLeft: 0 }}
    />
  );
}
