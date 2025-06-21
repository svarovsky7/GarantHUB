import React, { useEffect, useState } from 'react';
import { Form, Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import FileUploadTable from '@/shared/ui/FileUploadTable';
import type { RemoteClaimFile } from '@/shared/types/claimFile';
import { signedUrl } from '@/entities/claim';

export interface ClaimAttachmentsBlockProps {
  remoteFiles?: RemoteClaimFile[];
  newFiles?: File[];
  onFiles?: (files: File[]) => void;
  onRemoveRemote?: (id: string) => Promise<void> | void;
  onRemoveNew?: (index: number) => void;
  showUpload?: boolean;
  loading?: boolean;
}

export default function ClaimAttachmentsBlock({
  remoteFiles = [],
  newFiles = [],
  onFiles,
  onRemoveRemote,
  onRemoveNew,
  showUpload = true,
  loading = false,
}: ClaimAttachmentsBlockProps) {
  const [files, setFiles] = useState<RemoteClaimFile[]>(remoteFiles);

  useEffect(() => setFiles(remoteFiles), [remoteFiles]);

  const handleRemoveRemote = async (id: string) => {
    const cur = files;
    setFiles((p) => p.filter((f) => String(f.id) !== id));
    try {
      await onRemoveRemote?.(id);
    } catch (e) {
      setFiles(cur);
    }
  };

  const props: UploadProps = {
    multiple: true,
    showUploadList: false,
    customRequest: (info) => {
      onFiles?.([info.file as File]);
      info.onSuccess?.({}, info.file);
    },
  };

  return (
    <Form.Item label="Файлы">
      {showUpload && (
        <Upload.Dragger {...props} style={{ height: 120 }} aria-label="Загрузить файлы">
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Перетащите файлы (до 50 MB)</p>
        </Upload.Dragger>
      )}
      <FileUploadTable
        remoteFiles={files.map((f) => ({
          id: String(f.id),
          name: f.original_name ?? f.name,
          path: f.path,
        }))}
        newFiles={newFiles.map((f) => ({ file: f }))}
        onRemoveRemote={handleRemoveRemote}
        onRemoveNew={onRemoveNew}
        getSignedUrl={(path, name) => signedUrl(path, name)}
        loading={loading}
      />
    </Form.Item>
  );
}
