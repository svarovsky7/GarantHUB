import React from 'react';
import { List, Button, Space, Tooltip, Typography, Empty, Spin, Upload, message } from 'antd';
import {
  FileOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { supabase } from '@/shared/api/supabaseClient';
import type { PreviewFile } from '@/shared/types/previewFile';

const { Text } = Typography;

interface AttachmentFile {
  id?: string;
  name: string;
  path?: string;
  mime_type?: string;
  url?: string;
  isNew?: boolean;
  file?: File;
  objectUrl?: string;
}

interface EngineerCallAttachmentsProps {
  remoteFiles: any[];
  newFiles: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveRemote: (id: string) => void;
  onRemoveNew: (index: number) => void;
  onPreview: (file: PreviewFile) => void;
  loading?: boolean;
}

const EngineerCallAttachments: React.FC<EngineerCallAttachmentsProps> = ({
  remoteFiles,
  newFiles,
  onAddFiles,
  onRemoveRemote,
  onRemoveNew,
  onPreview,
  loading = false,
}) => {
  // Объединяем файлы для отображения
  const allFiles: AttachmentFile[] = [
    ...remoteFiles.map(f => ({
      id: String(f.id),
      name: f.original_name || f.name,
      path: f.path,
      mime_type: f.mime_type,
      url: f.url,
      isNew: false,
    })),
    ...newFiles.map((f, index) => ({
      name: f.name,
      mime_type: f.type,
      isNew: true,
      file: f,
      objectUrl: URL.createObjectURL(f),
    })),
  ];

  // Очищаем object URLs при размонтировании
  React.useEffect(() => {
    const urls = newFiles.map(f => URL.createObjectURL(f));
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [newFiles]);

  // Получить иконку по типу файла
  const getFileIcon = (mimeType?: string, name?: string) => {
    if (!mimeType && name) {
      const ext = name.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
        return <FileImageOutlined style={{ fontSize: 20, color: '#52c41a' }} />;
      }
      if (ext === 'pdf') {
        return <FilePdfOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />;
      }
      if (['doc', 'docx'].includes(ext || '')) {
        return <FileWordOutlined style={{ fontSize: 20, color: '#1890ff' }} />;
      }
      if (['xls', 'xlsx'].includes(ext || '')) {
        return <FileExcelOutlined style={{ fontSize: 20, color: '#52c41a' }} />;
      }
      if (['txt', 'log'].includes(ext || '')) {
        return <FileTextOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />;
      }
    }
    
    if (mimeType?.startsWith('image/')) {
      return <FileImageOutlined style={{ fontSize: 20, color: '#52c41a' }} />;
    }
    if (mimeType === 'application/pdf') {
      return <FilePdfOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />;
    }
    if (mimeType?.includes('word') || mimeType?.includes('document')) {
      return <FileWordOutlined style={{ fontSize: 20, color: '#1890ff' }} />;
    }
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) {
      return <FileExcelOutlined style={{ fontSize: 20, color: '#52c41a' }} />;
    }
    if (mimeType?.startsWith('text/')) {
      return <FileTextOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />;
    }
    
    return <FileOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />;
  };

  // Обработчик просмотра файла
  const handlePreview = async (file: AttachmentFile) => {
    let previewUrl = '';
    
    if (file.isNew && file.objectUrl) {
      previewUrl = file.objectUrl;
    } else if (!file.isNew) {
      // Для удаленных файлов получаем подписанный URL
      if (file.url) {
        previewUrl = file.url;
      } else if (file.path) {
        const { data, error } = await supabase.storage
          .from('attachments')
          .createSignedUrl(file.path, 3600); // URL на 1 час
        
        if (!error && data?.signedUrl) {
          previewUrl = data.signedUrl;
        }
      }
    }
    
    if (previewUrl) {
      onPreview({
        url: previewUrl,
        name: file.name,
        mime: file.mime_type,
      });
    } else {
      message.error('Не удалось получить ссылку для просмотра файла');
    }
  };

  // Обработчик скачивания файла
  const handleDownload = async (file: AttachmentFile) => {
    let downloadUrl = '';
    
    if (file.isNew && file.objectUrl) {
      downloadUrl = file.objectUrl;
    } else if (!file.isNew) {
      if (file.url) {
        downloadUrl = file.url;
      } else if (file.path) {
        const { data, error } = await supabase.storage
          .from('attachments')
          .createSignedUrl(file.path, 3600);
        
        if (!error && data?.signedUrl) {
          downloadUrl = data.signedUrl;
        }
      }
    }
    
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      message.error('Не удалось скачать файл');
    }
  };

  // Настройки загрузки
  const uploadProps: UploadProps = {
    multiple: true,
    showUploadList: false,
    beforeUpload: (file) => {
      onAddFiles([file]);
      return false; // Предотвращаем автоматическую загрузку
    },
  };

  if (loading) {
    return <Spin tip="Загрузка файлов..." />;
  }

  return (
    <div>
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />} style={{ marginBottom: 16 }}>
          Добавить файлы
        </Button>
      </Upload>

      {allFiles.length === 0 ? (
        <Empty description="Нет загруженных файлов" />
      ) : (
        <List
          size="small"
          dataSource={allFiles}
          renderItem={(file, index) => (
            <List.Item
              key={file.id || `new-${index}`}
              actions={[
                <Tooltip title="Просмотреть">
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(file)}
                  />
                </Tooltip>,
                <Tooltip title="Скачать">
                  <Button
                    type="text"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(file)}
                  />
                </Tooltip>,
                <Tooltip title="Удалить">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      if (!file.isNew && file.id) {
                        onRemoveRemote(file.id);
                      } else if (file.isNew) {
                        const newIndex = newFiles.findIndex(f => f === file.file);
                        if (newIndex !== -1) {
                          onRemoveNew(newIndex);
                        }
                      }
                    }}
                  />
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                avatar={getFileIcon(file.mime_type, file.name)}
                title={
                  <Space>
                    <Text>{file.name}</Text>
                    {file.isNew && <Text type="secondary">(новый)</Text>}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default EngineerCallAttachments;