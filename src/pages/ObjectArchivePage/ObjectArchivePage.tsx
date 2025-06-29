import React from 'react';
import { ConfigProvider, Typography, Divider, Skeleton, Upload, Input } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useSearchParams } from 'react-router-dom';
import { UploadOutlined } from '@ant-design/icons';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useUnitArchive } from '@/entities/unitArchive';

export default function ObjectArchivePage() {
  const [params] = useSearchParams();
  const unitId = Number(params.get('unit_id'));
  const { data, isLoading } = useUnitArchive(Number.isNaN(unitId) ? undefined : unitId);
  const [newObjectFiles, setNewObjectFiles] = React.useState<{ file: File; description: string }[]>([]);

  return (
    <ConfigProvider locale={ruRU}>
      <Typography.Title level={3}>Архив документации</Typography.Title>
      {isLoading && <Skeleton active />} 
      {!isLoading && (
        <>
          <Typography.Title level={4}>
            Документы по объекту{' '}
            <Upload
              beforeUpload={(file) => {
                setNewObjectFiles((p) => [...p, { file, description: '' }]);
                return false;
              }}
              showUploadList={false}
            >
              <UploadOutlined />
            </Upload>
          </Typography.Title>
          <AttachmentEditorTable
            remoteFiles={data?.objectDocs}
            newFiles={newObjectFiles.map((f) => ({ file: f.file, description: f.description }))}
            onDescNew={(idx, d) =>
              setNewObjectFiles((p) => p.map((f, i) => (i === idx ? { ...f, description: d } : f)))
            }
            showMime={false}
            showDetails
          />
          <Divider />
          <Typography.Title level={4}>Документы по замечаниям</Typography.Title>
          <AttachmentEditorTable
            remoteFiles={data?.remarkDocs}
            showMime={false}
            getLink={(f) => `/claims?id=${f.entityId}`}
          />
          <Divider />
          <Typography.Title level={4}>Документы по дефектам</Typography.Title>
          <AttachmentEditorTable
            remoteFiles={data?.defectDocs}
            showMime={false}
            getLink={(f) => `/defects?id=${f.entityId}`}
          />
          <Divider />
          <Typography.Title level={4}>Документы по судебным делам</Typography.Title>
          <AttachmentEditorTable
            remoteFiles={data?.courtDocs}
            showMime={false}
            getLink={(f) => `/court-cases?id=${f.entityId}`}
          />
        </>
      )}
    </ConfigProvider>
  );
}
