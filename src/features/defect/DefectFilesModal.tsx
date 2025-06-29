import React from 'react';
import { Modal } from 'antd';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import type { NewDefectFile } from '@/shared/types/defectFile';

/**
 * Модальное окно выбора файлов для нового дефекта.
 */
export interface DefectFilesModalProps {
  /** Открыто ли окно */
  open: boolean;
  /** Текущие файлы */
  files: NewDefectFile[];
  /** Изменение файлов */
  onChange: (files: NewDefectFile[]) => void;
  /** Закрытие окна */
  onClose: () => void;
}

export default function DefectFilesModal({
  open,
  files,
  onChange,
  onClose,
}: DefectFilesModalProps) {
  const handleFiles = (f: File[]) => {
    onChange([...files, ...f.map((file) => ({ file, description: '' }))]);
  };
  const removeFile = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx));
  };
  const changeDesc = (idx: number, d: string) => {
    onChange(files.map((f, i) => (i === idx ? { ...f, description: d } : f)));
  };
  return (
    <Modal open={open} onCancel={onClose} onOk={onClose} title="Файлы дефекта">
      <FileDropZone onFiles={handleFiles} />
      <AttachmentEditorTable
        newFiles={files.map((f) => ({ file: f.file, mime: f.file.type, description: f.description }))}
        showMime={false}
        showDetails
        onRemoveNew={removeFile}
        onDescNew={changeDesc}
      />
    </Modal>
  );
}
