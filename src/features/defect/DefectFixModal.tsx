import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Modal, Form, Select, DatePicker, Button } from 'antd';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useBrigades } from '@/entities/brigade';
import { useContractors } from '@/entities/contractor';
import { useAttachmentTypes } from '@/entities/attachmentType';
import { useFixDefect } from '@/entities/defect';
import type { NewDefectFile } from '@/shared/types/defectFile';

interface Props {
  defectId: number | null;
  open: boolean;
  onClose: () => void;
}

/** Модальное окно внесения данных об устранении дефекта */
export default function DefectFixModal({ defectId, open, onClose }: Props) {
  const { data: brigades = [] } = useBrigades();
  const { data: contractors = [] } = useContractors();
  const { data: attachmentTypes = [] } = useAttachmentTypes();
  const fix = useFixDefect();

  const [brigadeId, setBrigadeId] = useState<number | null>(null);
  const [contractorId, setContractorId] = useState<number | null>(null);
  const [fixedAt, setFixedAt] = useState<dayjs.Dayjs | null>(null);
  const [files, setFiles] = useState<NewDefectFile[]>([]);

  const handleFiles = (f: File[]) => {
    setFiles((p) => [...p, ...f.map((file) => ({ file, type_id: null }))]);
  };

  const changeType = (idx: number, type: number | null) => {
    setFiles((p) => p.map((f, i) => (i === idx ? { ...f, type_id: type } : f)));
  };

  const removeFile = (idx: number) => {
    setFiles((p) => p.filter((_, i) => i !== idx));
  };

  const handleOk = async () => {
    if (!defectId) return;
    await fix.mutateAsync({
      id: defectId,
      brigade_id: brigadeId,
      contractor_id: contractorId,
      fixed_at: fixedAt ? fixedAt.format('YYYY-MM-DD') : null,
      attachments: files,
    });
    setFiles([]);
    setBrigadeId(null);
    setContractorId(null);
    setFixedAt(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={fix.isPending}
      title="Устранение дефекта"
    >
      <Form layout="vertical">
        <Form.Item label="Бригада">
          <Select
            allowClear
            value={brigadeId ?? undefined}
            options={brigades.map((b) => ({ value: b.id, label: b.name }))}
            onChange={(v) => {
              setBrigadeId(v ?? null);
              if (v) setContractorId(null);
            }}
          />
        </Form.Item>
        <Form.Item label="Подрядчик">
          <Select
            allowClear
            value={contractorId ?? undefined}
            options={contractors.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(v) => {
              setContractorId(v ?? null);
              if (v) setBrigadeId(null);
            }}
          />
        </Form.Item>
        <Form.Item label="Дата устранения">
          <DatePicker
            format="DD.MM.YYYY"
            value={fixedAt ?? undefined}
            onChange={(d) => setFixedAt(d)}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="Файлы">
          <FileDropZone onFiles={handleFiles} />
          <AttachmentEditorTable
            newFiles={files.map((f) => ({ file: f.file, typeId: f.type_id, mime: f.file.type }))}
            attachmentTypes={attachmentTypes}
            onRemoveNew={removeFile}
            onChangeNewType={changeType}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
