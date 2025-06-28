import React from 'react';
import { Skeleton } from 'antd';
import { useDefectAttachments } from '@/entities/defect';
import DefectFilesTable from './DefectFilesTable';
import type { RemoteDefectFile } from '@/shared/types/defectFile';

export default function DefectFilesLoader({ defectId }: { defectId: number }) {
  const { data = [], isLoading } = useDefectAttachments(defectId);
  const files: RemoteDefectFile[] = (data ?? []).map((f: any) => ({
    id: String(f.id),
    name: f.original_name ?? f.storage_path.split('/').pop(),
    path: f.storage_path,
    url: f.file_url,
    mime_type: f.file_type,
    size: (f as any).file_size,
  }));

  if (isLoading) return <Skeleton active paragraph={{ rows: 2 }} />;
  if (!files.length) return null;
  return <DefectFilesTable defectId={defectId} files={files} />;
}
