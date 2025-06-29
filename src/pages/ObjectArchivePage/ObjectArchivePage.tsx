import React from 'react';
import { ConfigProvider, Typography, Divider, Skeleton, Upload, Input, Button } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useSearchParams } from 'react-router-dom';
import { UploadOutlined } from '@ant-design/icons';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useUnitArchive } from '@/entities/unitArchive';
import { signedUrl, updateAttachmentDescription } from '@/entities/attachment';
import { downloadZip } from '@/shared/utils/downloadZip';

export default function ObjectArchivePage() {
  const [params] = useSearchParams();
  const unitId = Number(params.get('unit_id'));
  const { data, isLoading } = useUnitArchive(Number.isNaN(unitId) ? undefined : unitId);
  const [newObjectFiles, setNewObjectFiles] = React.useState<{ file: File; description: string }[]>([]);

  const handleDescRemote = React.useCallback((id: string, d: string) => {
    updateAttachmentDescription(Number(id), d).catch(console.error);
  }, []);

  const handleDownloadArchive = async () => {
    const files = [
      ...(data?.objectDocs ?? []),
      ...(data?.remarkDocs ?? []),
      ...(data?.defectDocs ?? []),
      ...(data?.courtDocs ?? []),
      ...newObjectFiles.map((f) => ({ id: '', name: f.file.name, path: '', file: f.file })),
    ];
    const sources = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        getFile: async () => {
          if ('file' in f && f.file) return f.file;
          const url = await signedUrl(f.path, f.name);
          const res = await fetch(url);
          return res.blob();
        },
      })),
    );
    if (sources.length) {
      await downloadZip(sources, `unit-${unitId}-docs.zip`);
    }
  };

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
            <Button size="small" style={{ marginLeft: 8 }} onClick={handleDownloadArchive}>
              Скачать архив
            </Button>
          </Typography.Title>
          <AttachmentEditorTable
            remoteFiles={data?.objectDocs}
            newFiles={newObjectFiles.map((f) => ({ file: f.file, description: f.description }))}
            onDescNew={(idx, d) =>
              setNewObjectFiles((p) => p.map((f, i) => (i === idx ? { ...f, description: d } : f)))
            }
            onDescRemote={handleDescRemote}
            showMime={false}
            showDetails
            showSize
            getSignedUrl={(p, n) => signedUrl(p, n)}
          />
          <Divider />
          <Typography.Title level={4}>Документы по замечаниям</Typography.Title>
          <AttachmentEditorTable
            remoteFiles={data?.remarkDocs}
            onDescRemote={handleDescRemote}
            showMime={false}
            showDetails
            showSize
            getSignedUrl={(p, n) => signedUrl(p, n)}
            getLink={(f) => `/claims?id=${f.entityId}`}
          />
          <Divider />
          <Typography.Title level={4}>Документы по дефектам</Typography.Title>
          <AttachmentEditorTable
            remoteFiles={data?.defectDocs}
            onDescRemote={handleDescRemote}
            showMime={false}
            showDetails
            showSize
            getSignedUrl={(p, n) => signedUrl(p, n)}
            getLink={(f) => `/defects?id=${f.entityId}`}
          />
          <Divider />
          <Typography.Title level={4}>Документы по судебным делам</Typography.Title>
          <AttachmentEditorTable
            remoteFiles={data?.courtDocs}
            onDescRemote={handleDescRemote}
            showMime={false}
            showDetails
            showSize
            getSignedUrl={(p, n) => signedUrl(p, n)}
            getLink={(f) => `/court-cases?id=${f.entityId}`}
          />
        </>
      )}
    </ConfigProvider>
  );
}
