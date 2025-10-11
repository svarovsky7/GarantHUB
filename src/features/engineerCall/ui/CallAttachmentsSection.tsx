import React from 'react';
import { Form, Divider, Space } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';
import EngineerCallAttachments from '../EngineerCallAttachments';
import type { PreviewFile } from '@/shared/types/previewFile';

interface RemoteFile {
  id: string;
  file_name: string;
  file_path: string;
  description?: string;
  created_at: string;
}

interface CallAttachmentsSectionProps {
  remoteFiles: RemoteFile[];
  newFiles: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveRemote: (id: string) => void;
  onRemoveNew: (index: number) => void;
  onPreview: (file: PreviewFile) => void;
}

/**
 * Attachments section
 */
const CallAttachmentsSection: React.FC<CallAttachmentsSectionProps> = ({
  remoteFiles,
  newFiles,
  onAddFiles,
  onRemoveRemote,
  onRemoveNew,
  onPreview,
}) => {
  return (
    <>
      <Divider orientation="left">
        <Space>
          <PaperClipOutlined />
          <span>Вложения</span>
        </Space>
      </Divider>

      <Form.Item label="Файлы">
        <EngineerCallAttachments
          remoteFiles={remoteFiles}
          newFiles={newFiles}
          onAddFiles={onAddFiles}
          onRemoveRemote={onRemoveRemote}
          onRemoveNew={onRemoveNew}
          onPreview={onPreview}
          loading={false}
        />
      </Form.Item>
    </>
  );
};

export default CallAttachmentsSection;
