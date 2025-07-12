import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  Typography,
  Skeleton,
  Button,
  Space,
  Tabs,
  Badge,
  message,
} from 'antd';
import {
  DownloadOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useDefect,
  signedUrl,
  useUpdateDefect,
  useAddDefectAttachments,
  useRemoveDefectAttachment,
} from '@/entities/defect';
import { updateAttachmentDescription } from '@/entities/attachment';
import { useQueryClient } from '@tanstack/react-query';
import { DefectEditForm } from './DefectEditForm';
import DefectAttachmentsBlock from './DefectAttachmentsBlock';
import { createDefectDocx } from '@/shared/utils/createDefectDocx';
import FilePreviewModal from '@/shared/ui/FilePreviewModal';
import type { PreviewFile } from '@/shared/types/previewFile';
import type { RemoteDefectFile } from '@/shared/types/defectFile';
import type { NewDefectFile } from '@/shared/types/defectFile';
import type { Defect } from '@/shared/types/defect';

interface Props {
  open: boolean;
  defectId: number | null;
  onClose: () => void;
}

export default function DefectViewEditModal({ open, defectId, onClose }: Props) {
  const { data: defect, isLoading } = useDefect(defectId ?? undefined);
  const updateDefect = useUpdateDefect();
  const addAttachments = useAddDefectAttachments();
  const removeAttachment = useRemoveDefectAttachment();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedDefect, setEditedDefect] = useState<Partial<Defect>>({});
  const [remoteFiles, setRemoteFiles] = useState<RemoteDefectFile[]>([]);
  const [newFiles, setNewFiles] = useState<NewDefectFile[]>([]);
  const [removedFileIds, setRemovedFileIds] = useState<number[]>([]);
  const [changedDescriptions, setChangedDescriptions] = useState<Record<number, string>>({});
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [saving, setSaving] = useState(false);
  
  const formRef = useRef<any>(null);
  const originalDescriptions = useRef<Record<number, string>>({});

  useEffect(() => {
    if (defect && open) {
      setEditedDefect({});
      const files = (defect.attachments ?? []).map((f: any) => ({
        id: String(f.id),
        name: f.original_name ?? f.storage_path.split('/').pop(),
        path: f.storage_path,
        mime_type: f.file_type,
        original_name: f.original_name,
        url: f.file_url,
        description: f.description ?? null,
      })) as RemoteDefectFile[];
      setRemoteFiles(files);
      
      originalDescriptions.current = {};
      files.forEach((f) => {
        originalDescriptions.current[Number(f.id)] = f.description ?? '';
      });
    }
  }, [defect, open]);

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setEditedDefect({});
      setNewFiles([]);
      setRemovedFileIds([]);
      setChangedDescriptions({});
      setActiveTab('info');
      originalDescriptions.current = {};
    }
  }, [open]);

  const handleFieldChange = (field: string, value: any) => {
    setEditedDefect((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddFiles = (files: File[]) => {
    const newDefectFiles: NewDefectFile[] = files.map((file) => ({
      file,
      description: null,
    }));
    setNewFiles((prev) => [...prev, ...newDefectFiles]);
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveRemoteFile = (fileId: string) => {
    setRemoteFiles((prev) => prev.filter((f) => f.id !== fileId));
    setRemovedFileIds((prev) => [...prev, Number(fileId)]);
    setChangedDescriptions((prev) => {
      const { [Number(fileId)]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleChangeNewFileDescription = (index: number, description: string) => {
    setNewFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, description } : f))
    );
  };

  const handleChangeRemoteFileDescription = (fileId: string, description: string) => {
    const original = originalDescriptions.current[Number(fileId)] ?? '';
    setRemoteFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, description } : f))
    );
    
    if (original === description) {
      setChangedDescriptions((prev) => {
        const { [Number(fileId)]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setChangedDescriptions((prev) => ({ ...prev, [Number(fileId)]: description }));
    }
  };

  const handleSave = async () => {
    if (!defectId) return;
    
    try {
      setSaving(true);
      
      // Валидация формы
      if (formRef.current?.form) {
        await formRef.current.form.validateFields();
      }
      
      // Обновление основных данных дефекта
      if (Object.keys(editedDefect).length > 0) {
        await updateDefect.mutateAsync({
          id: defectId,
          updates: editedDefect,
        });
      }
      
      // Загрузка новых файлов
      if (newFiles.length > 0) {
        const uploaded = await addAttachments.mutateAsync({
          defectId,
          files: newFiles.map(f => f.file),
          descriptions: newFiles.map(f => f.description),
        });
        
        // Добавляем загруженные файлы к списку
        const uploadedFiles = uploaded.map((u: any) => ({
          id: String(u.id),
          name: u.original_name ?? u.storage_path.split('/').pop(),
          path: u.storage_path,
          mime_type: u.file_type,
          original_name: u.original_name,
          url: u.file_url,
          description: u.description ?? null,
        }));
        setRemoteFiles((prev) => [...prev, ...uploadedFiles]);
        setNewFiles([]);
      }
      
      // Удаление файлов
      for (const fileId of removedFileIds) {
        await removeAttachment.mutateAsync({
          defectId,
          attachmentId: fileId,
        });
      }
      setRemovedFileIds([]);
      
      // Обновление описаний файлов
      for (const [fileId, description] of Object.entries(changedDescriptions)) {
        await updateAttachmentDescription(Number(fileId), description);
      }
      
      // Обновляем оригинальные описания
      remoteFiles.forEach((f) => {
        originalDescriptions.current[Number(f.id)] = f.description ?? '';
      });
      setChangedDescriptions({});
      
      // Инвалидация кэша
      await queryClient.invalidateQueries({ queryKey: ['defects'] });
      await queryClient.invalidateQueries({ queryKey: ['defect', defectId] });
      
      message.success('Изменения сохранены');
      setIsEditing(false);
      setEditedDefect({});
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      message.error('Ошибка при сохранении изменений');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (defect) {
      setEditedDefect({});
      setIsEditing(false);
      setNewFiles([]);
      setRemovedFileIds([]);
      setChangedDescriptions({});
      
      // Восстанавливаем файлы
      const files = (defect.attachments ?? []).map((f: any) => ({
        id: String(f.id),
        name: f.original_name ?? f.storage_path.split('/').pop(),
        path: f.storage_path,
        mime_type: f.file_type,
        original_name: f.original_name,
        url: f.file_url,
        description: f.description ?? null,
      })) as RemoteDefectFile[];
      setRemoteFiles(files);
    }
  };

  const downloadDocx = () => {
    if (defect) createDefectDocx(defect as any);
  };

  const hasChanges = 
    Object.keys(editedDefect).length > 0 ||
    newFiles.length > 0 ||
    removedFileIds.length > 0 ||
    Object.keys(changedDescriptions).length > 0;

  if (!defectId || !open) return null;

  const title = defect
    ? `Дефект №${defect.id} от ${dayjs(defect.received_at ?? defect.created_at).format('DD.MM.YYYY')}`
    : 'Дефект';

  const tabItems = [
    {
      key: 'info',
      label: 'Информация',
      children: isLoading || !defect ? (
        <Skeleton active />
      ) : isEditing ? (
        <DefectEditForm
          ref={formRef}
          defect={{ ...defect, ...editedDefect } as Defect}
          onFieldChange={handleFieldChange}
          embedded
        />
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Typography.Paragraph>
            <Typography.Text strong>Описание:</Typography.Text> {defect.description}
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Typography.Text strong>Тип дефекта:</Typography.Text> {defect.defect_type?.name ?? '—'}
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Typography.Text strong>Статус:</Typography.Text> {defect.defect_status?.name ?? '—'}
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Typography.Text strong>Ответственный инженер:</Typography.Text>{' '}
            {defect.engineer?.name ?? defect.engineer?.email ?? '—'}
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Typography.Text strong>Кем устраняется:</Typography.Text>{' '}
            {defect.brigade?.name ?? defect.contractor?.name ?? '—'}
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Typography.Text strong>Дата получения:</Typography.Text>{' '}
            {defect.received_at ? dayjs(defect.received_at).format('DD.MM.YYYY') : '—'}
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Typography.Text strong>Дата устранения:</Typography.Text>{' '}
            {defect.fixed_at ? dayjs(defect.fixed_at).format('DD.MM.YYYY') : '—'}
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Typography.Text strong>Гарантийный:</Typography.Text> {defect.is_warranty ? 'Да' : 'Нет'}
          </Typography.Paragraph>
        </Space>
      ),
    },
    {
      key: 'attachments',
      label: (
        <span>
          Вложения{' '}
          <Badge count={remoteFiles.length + newFiles.length} showZero />
        </span>
      ),
      children: (
        <DefectAttachmentsBlock
          remoteFiles={remoteFiles}
          newFiles={newFiles}
          onFiles={isEditing ? handleAddFiles : undefined}
          onRemove={isEditing ? handleRemoveRemoteFile : undefined}
          onRemoveNew={isEditing ? handleRemoveNewFile : undefined}
          onDescRemote={isEditing ? handleChangeRemoteFileDescription : undefined}
          onDescNew={isEditing ? handleChangeNewFileDescription : undefined}
          getSignedUrl={(p, n) => signedUrl(p, n)}
          onPreview={(file) => setPreviewFile(file)}
          readOnly={!isEditing}
        />
      ),
    },
  ];

  return (
    <>
      <Modal
        open={open}
        onCancel={isEditing ? handleCancel : onClose}
        footer={null}
        width="80%"
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {title}
            </Typography.Title>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={downloadDocx}
                title="Скачать форму устранения"
              >
                Скачать DOCX
              </Button>
              {!isEditing ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setIsEditing(true)}
                >
                  Редактировать
                </Button>
              ) : (
                <>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={saving}
                    disabled={!hasChanges}
                  >
                    Сохранить
                  </Button>
                </>
              )}
            </Space>
          </div>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Modal>
      <FilePreviewModal
        open={previewFile !== null}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </>
  );
}