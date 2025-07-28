import React from 'react';
import { ConfigProvider, Typography, Divider, Skeleton, Upload, Input, Button } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useSearchParams } from 'react-router-dom';
import { UploadOutlined } from '@ant-design/icons';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useUnitArchive } from '@/entities/unitArchive';
import ClaimViewModal from '@/features/claim/ClaimViewModal';
import DefectViewModal from '@/features/defect/DefectViewModal';
import CourtCaseViewModal from '@/features/courtCase/CourtCaseViewModal';
import LetterViewModal from '@/features/correspondence/LetterViewModal';
import { 
  signedUrl,
  signedUrlForPreview,
  updateAttachmentDescription,
  addUnitAttachments,
  removeUnitAttachment,
  removeArchiveAttachment,
} from '@/entities/attachment';
import FilePreviewModal from '@/shared/ui/FilePreviewModal';
import type { PreviewFile } from '@/shared/types/previewFile';
import { downloadZip } from '@/shared/utils/downloadZip';
import type { ArchiveFile } from '@/shared/types/archiveFile';
import { useUsers } from '@/entities/user';
import { useQueryClient } from '@tanstack/react-query';

interface ArchiveFileWithUser extends ArchiveFile {
  createdByName?: string | null;
}

export default function ObjectArchivePage() {
  const [params] = useSearchParams();
  const unitId = Number(params.get('unit_id'));
  const { data, isLoading } = useUnitArchive(Number.isNaN(unitId) ? undefined : unitId);
  const { data: users = [] } = useUsers();
  const userMap = React.useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      map.set(u.id, u.name ?? '');
    });
    return map;
  }, [users]);
  const qc = useQueryClient();
  const [newObjectFiles, setNewObjectFiles] = React.useState<{ file: File; description: string }[]>([]);
  const [objectFiles, setObjectFiles] = React.useState<ArchiveFileWithUser[]>([]);
  const [remarkFiles, setRemarkFiles] = React.useState<ArchiveFileWithUser[]>([]);
  const [defectFiles, setDefectFiles] = React.useState<ArchiveFileWithUser[]>([]);
  const [courtFiles, setCourtFiles] = React.useState<ArchiveFileWithUser[]>([]);
  const [letterFiles, setLetterFiles] = React.useState<ArchiveFileWithUser[]>([]);
  const descInit = React.useRef<Record<string, string | null>>({});
  const [changed, setChanged] = React.useState<Record<string, string>>({});
  const [viewClaimId, setViewClaimId] = React.useState<number | null>(null);
  const [viewDefectId, setViewDefectId] = React.useState<number | null>(null);
  const [viewCourtId, setViewCourtId] = React.useState<number | null>(null);
  const [viewLetterId, setViewLetterId] = React.useState<number | null>(null);
  const [previewFile, setPreviewFile] = React.useState<PreviewFile | null>(null);
  const [removedIds, setRemovedIds] = React.useState<string[]>([]);
  const [removedFilesInfo, setRemovedFilesInfo] = React.useState<Record<string, { type: string; entityId?: number }>>({});

  const changedFlags = React.useMemo(() => {
    const map: Record<string, boolean> = {};
    Object.keys(changed).forEach((k) => {
      map[k] = true;
    });
    return map;
  }, [changed]);

  React.useEffect(() => {
    if (!data) return;
    const withNames = (files: ArchiveFile[]): ArchiveFileWithUser[] =>
      files.map((f) => ({
        ...f,
        createdByName: f.createdBy ? userMap.get(f.createdBy) ?? null : null,
      }));
    setObjectFiles(withNames(data.objectDocs));
    setRemarkFiles(withNames(data.remarkDocs));
    setDefectFiles(withNames(data.defectDocs));
    setCourtFiles(withNames(data.courtDocs));
    setLetterFiles(withNames(data.letterDocs));
    const map: Record<string, string | null> = {};
    [...data.objectDocs, ...data.remarkDocs, ...data.defectDocs, ...data.courtDocs, ...data.letterDocs].forEach((f) => {
      map[f.id] = f.description ?? '';
    });
    descInit.current = map;
    setChanged({});
    setNewObjectFiles([]);
  }, [data, userMap]);

  const setDescHelper = (
    setter: React.Dispatch<React.SetStateAction<ArchiveFileWithUser[]>>,
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
  const handleDescLetter = React.useCallback((id: string, d: string) => {
    setDescHelper(setLetterFiles, id, d);
  }, []);

  const handleRemoveObjectFile = React.useCallback((id: string) => {
    setObjectFiles((p) => p.filter((f) => f.id !== id));
    setRemovedIds((p) => [...p, id]);
    setRemovedFilesInfo((p) => ({ ...p, [id]: { type: 'object' } }));
  }, []);

  const handleRemoveRemarkFile = React.useCallback((id: string) => {
    const file = remarkFiles.find(f => f.id === id);
    setRemarkFiles((p) => p.filter((f) => f.id !== id));
    setRemovedIds((p) => [...p, id]);
    setRemovedFilesInfo((p) => ({ ...p, [id]: { type: 'remark', entityId: file?.entityId } }));
  }, [remarkFiles]);

  const handleRemoveDefectFile = React.useCallback((id: string) => {
    const file = defectFiles.find(f => f.id === id);
    setDefectFiles((p) => p.filter((f) => f.id !== id));
    setRemovedIds((p) => [...p, id]);
    setRemovedFilesInfo((p) => ({ ...p, [id]: { type: 'defect', entityId: file?.entityId } }));
  }, [defectFiles]);

  const handleRemoveCourtFile = React.useCallback((id: string) => {
    const file = courtFiles.find(f => f.id === id);
    setCourtFiles((p) => p.filter((f) => f.id !== id));
    setRemovedIds((p) => [...p, id]);
    setRemovedFilesInfo((p) => ({ ...p, [id]: { type: 'court', entityId: file?.entityId } }));
  }, [courtFiles]);

  const handleRemoveLetterFile = React.useCallback((id: string) => {
    const file = letterFiles.find(f => f.id === id);
    setLetterFiles((p) => p.filter((f) => f.id !== id));
    setRemovedIds((p) => [...p, id]);
    setRemovedFilesInfo((p) => ({ ...p, [id]: { type: 'letter', entityId: file?.entityId } }));
  }, [letterFiles]);

  const handleDownloadArchive = async () => {
    const files = [
      ...objectFiles,
      ...remarkFiles,
      ...defectFiles,
      ...courtFiles,
      ...letterFiles,
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
      // Удаляем файлы
      if (removedIds.length) {
        await Promise.all(
          removedIds.map(async (id) => {
            const fileInfo = removedFilesInfo[id];
            if (!fileInfo) {
              return;
            }
            
            switch (fileInfo.type) {
              case 'object':
                return removeUnitAttachment(unitId, id);
              case 'remark':
                return removeArchiveAttachment(id, 'claim_attachments', 'claim_id', fileInfo.entityId!);
              case 'defect':
                return removeArchiveAttachment(id, 'defect_attachments', 'defect_id', fileInfo.entityId!);
              case 'court':
                return removeArchiveAttachment(id, 'court_case_attachments', 'court_case_id', fileInfo.entityId!);
              case 'letter':
                return removeArchiveAttachment(id, 'letter_attachments', 'letter_id', fileInfo.entityId!);
            }
          })
        );
      }
      
      // Обновляем описания
      await Promise.all(
        Object.entries(changed).map(([id, val]) =>
          updateAttachmentDescription(Number(id), val),
        ),
      );
      
      // Добавляем новые файлы
      if (newObjectFiles.length) {
        await addUnitAttachments(
          newObjectFiles.map((f) => ({ file: f.file, description: f.description })),
          unitId,
        );
      }
      
      await qc.invalidateQueries({ queryKey: ['unit-archive', unitId] });
      setRemovedIds([]);
      setRemovedFilesInfo({});
    } catch (e) {
      console.error('Save failed:', e);
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
            onRemoveRemote={handleRemoveObjectFile}
            onRemoveNew={(idx) => setNewObjectFiles((p) => p.filter((_, i) => i !== idx))}
            showMime={false}
            showDetails
            showSize
            showHeader
            showLink
            showCreatedAt
            showCreatedBy
          changedMap={changedFlags}
          getSignedUrl={(p, n) => signedUrl(p, n)}
          getSignedUrlForPreview={(p) => signedUrlForPreview(p)}
          onPreview={setPreviewFile}
        />
          <Divider />
          <Typography.Title level={4}>Документы по замечаниям</Typography.Title>
          <AttachmentEditorTable
            remoteFiles={remarkFiles}
            onDescRemote={handleDescRemark}
            onRemoveRemote={handleRemoveRemarkFile}
            showMime={false}
            showDetails
            showSize
            showHeader
            showLink
            showCreatedAt
            showCreatedBy
          changedMap={changedFlags}
          getSignedUrl={(p, n) => signedUrl(p, n)}
          getSignedUrlForPreview={(p) => signedUrlForPreview(p)}
          onPreview={setPreviewFile}
          onOpenLink={(f) => setViewClaimId(Number(f.entityId))}
          getLinkLabel={() => 'Замечание'}
        />
          <Divider />
          <Typography.Title level={4}>Документы по дефектам</Typography.Title>
          <AttachmentEditorTable
            remoteFiles={defectFiles}
            onDescRemote={handleDescDefect}
            onRemoveRemote={handleRemoveDefectFile}
            showMime={false}
            showDetails
            showSize
            showHeader
            showLink
            showCreatedAt
            showCreatedBy
          changedMap={changedFlags}
          getSignedUrl={(p, n) => signedUrl(p, n)}
          getSignedUrlForPreview={(p) => signedUrlForPreview(p)}
          onPreview={setPreviewFile}
          onOpenLink={(f) => setViewDefectId(Number(f.entityId))}
          getLinkLabel={() => 'Дефект'}
        />
          <Divider />
          <Typography.Title level={4}>Документы по судебным делам</Typography.Title>
          <AttachmentEditorTable
            remoteFiles={courtFiles}
            onDescRemote={handleDescCourt}
            onRemoveRemote={handleRemoveCourtFile}
            showMime={false}
            showDetails
            showSize
            showHeader
            showLink
            showCreatedAt
            showCreatedBy
          changedMap={changedFlags}
          getSignedUrl={(p, n) => signedUrl(p, n)}
          getSignedUrlForPreview={(p) => signedUrlForPreview(p)}
          onPreview={setPreviewFile}
          onOpenLink={(f) => setViewCourtId(Number(f.entityId))}
          getLinkLabel={() => 'Судебное дело'}
        />
          <Divider />
          <Typography.Title level={4}>Файлы из писем</Typography.Title>
          <AttachmentEditorTable
            remoteFiles={letterFiles}
            onDescRemote={handleDescLetter}
            onRemoveRemote={handleRemoveLetterFile}
            showMime={false}
            showDetails
            showSize
            showHeader
            showLink
            showCreatedAt
            showCreatedBy
          changedMap={changedFlags}
          getSignedUrl={(p, n) => signedUrl(p, n)}
          getSignedUrlForPreview={(p) => signedUrlForPreview(p)}
          onPreview={setPreviewFile}
          onOpenLink={(f) => setViewLetterId(Number(f.entityId))}
          getLinkLabel={(f) => `Письмо №${f.entityId}`}
        />
          <Divider />
          <Button type="primary" disabled={!newObjectFiles.length && !Object.keys(changed).length && !removedIds.length} onClick={handleSave}>
            Сохранить изменения
          </Button>
          <ClaimViewModal open={viewClaimId !== null} claimId={viewClaimId} onClose={() => setViewClaimId(null)} />
          <DefectViewModal open={viewDefectId !== null} defectId={viewDefectId} onClose={() => setViewDefectId(null)} />
          <CourtCaseViewModal open={viewCourtId !== null} caseId={viewCourtId} onClose={() => setViewCourtId(null)} />
          <LetterViewModal open={viewLetterId !== null} letterId={viewLetterId} onClose={() => setViewLetterId(null)} />
          <FilePreviewModal
            open={previewFile !== null}
            file={previewFile}
            onClose={() => setPreviewFile(null)}
          />
        </>
      )}
    </ConfigProvider>
  );
}
