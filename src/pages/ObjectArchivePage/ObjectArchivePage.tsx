import React from 'react';
import { ConfigProvider, Typography, Divider, Skeleton, Upload, Input, Button } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useSearchParams } from 'react-router-dom';
import { UploadOutlined } from '@ant-design/icons';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useUnitArchive } from '@/entities/unitArchive';
import {
  signedUrl,
  updateAttachmentDescription,
  addUnitAttachments,
} from '@/entities/attachment';
import { downloadZip } from '@/shared/utils/downloadZip';
import type { ArchiveFile } from '@/shared/types/archiveFile';
import { useQueryClient } from '@tanstack/react-query';

export default function ObjectArchivePage() {
  const [params] = useSearchParams();
  const unitId = Number(params.get('unit_id'));
  const { data, isLoading } = useUnitArchive(Number.isNaN(unitId) ? undefined : unitId);
  const qc = useQueryClient();
  const [newObjectFiles, setNewObjectFiles] = React.useState<{ file: File; description: string }[]>([]);
  const [objectFiles, setObjectFiles] = React.useState<ArchiveFile[]>([]);
  const [remarkFiles, setRemarkFiles] = React.useState<ArchiveFile[]>([]);
  const [defectFiles, setDefectFiles] = React.useState<ArchiveFile[]>([]);
  const [courtFiles, setCourtFiles] = React.useState<ArchiveFile[]>([]);
  const descInit = React.useRef<Record<string, string | null>>({});
  const [changed, setChanged] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!data) return;
    setObjectFiles(data.objectDocs);
    setRemarkFiles(data.remarkDocs);
    setDefectFiles(data.defectDocs);
    setCourtFiles(data.courtDocs);
    const map: Record<string, string | null> = {};
    [...data.objectDocs, ...data.remarkDocs, ...data.defectDocs, ...data.courtDocs].forEach((f) => {
      map[f.id] = f.description ?? '';
    });
    descInit.current = map;
    setChanged({});
    setNewObjectFiles([]);
  }, [data]);

  const setDescHelper = (
    setter: React.Dispatch<React.SetStateAction<ArchiveFile[]>>, 
    id: string, 
    val: string
  ) => {
    setter((p) => p.map((f) => (f.id === id ? { ...f, description: val } : f)));
    setChanged((prev) => {
      const init = descInit.current[id] ?? '';
      if (init === val) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: val };
    });
  };

  const handleDescObject = React.useCallback((id: string, d: string) => {
    setDescHelper(setObjectFiles, id, d);
  }, []);
  const handleDescRemark = React.useCallback((id: string, d: string) => {
    setDescHelper(setRemarkFiles, id, d);
  }, []);
  const handleDescDefect = React.useCallback((id: string, d: string) => {
    setDescHelper(setDefectFiles, id, d);
  }, []);
  const handleDescCourt = React.useCallback((id: string, d: string) => {
    setDescHelper(setCourtFiles, id, d);
  }, []);

  const handleDownloadArchive = async () => {
    const files = [
      ...objectFiles,
      ...remarkFiles,
      ...defectFiles,
      ...courtFiles,
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

  const handleSave = async () => {
    try {
      await Promise.all(
        Object.entries(changed).map(([id, val]) =>
          updateAttachmentDescription(Number(id), val),
        ),
      );
      if (newObjectFiles.length) {
        await addUnitAttachments(
          newObjectFiles.map((f) => ({ file: f.file, description: f.description })),
          unitId,
        );
      }
      await qc.invalidateQueries(['unit-archive', unitId]);
    } catch (e) {
      console.error(e);
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
              multiple
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
            remoteFiles={objectFiles}
            newFiles={newObjectFiles.map((f) => ({ file: f.file, description: f.description }))}
            onDescNew={(idx, d) =>
              setNewObjectFiles((p) => p.map((f, i) => (i === idx ? { ...f, description: d } : f)))
            }
            onDescRemote={handleDescObject}
            showMime={false}
            showDetails
            showSize
            changedMap={changed}
            getSignedUrl={(p, n) => signedUrl(p, n)}
          />
          <Divider />
          <Typography.Title level={4}>Документы по замечаниям</Typography.Title>
          <AttachmentEditorTable
            remoteFiles={remarkFiles}
            onDescRemote={handleDescRemark}
            showMime={false}
            showDetails
            showSize
            changedMap={changed}
            getSignedUrl={(p, n) => signedUrl(p, n)}
            getLink={(f) => `/claims?id=${f.entityId}`}
          />
          <Divider />
          <Typography.Title level={4}>Документы по дефектам</Typography.Title>
          <AttachmentEditorTable
            remoteFiles={defectFiles}
            onDescRemote={handleDescDefect}
            showMime={false}
            showDetails
            showSize
            changedMap={changed}
            getSignedUrl={(p, n) => signedUrl(p, n)}
            getLink={(f) => `/defects?id=${f.entityId}`}
          />
          <Divider />
          <Typography.Title level={4}>Документы по судебным делам</Typography.Title>
          <AttachmentEditorTable
            remoteFiles={courtFiles}
            onDescRemote={handleDescCourt}
            showMime={false}
            showDetails
            showSize
            changedMap={changed}
            getSignedUrl={(p, n) => signedUrl(p, n)}
            getLink={(f) => `/court-cases?id=${f.entityId}`}
          />
          <Divider />
          <Button type="primary" disabled={!newObjectFiles.length && !Object.keys(changed).length} onClick={handleSave}>
            Сохранить изменения
          </Button>
        </>
      )}
    </ConfigProvider>
  );
}
