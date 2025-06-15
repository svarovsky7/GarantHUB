import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Modal, Form, DatePicker } from 'antd';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useBrigades } from '@/entities/brigade';
import { useContractors } from '@/entities/contractor';
import { useAttachmentTypes } from '@/entities/attachmentType';
import { useFixDefect, useDefect } from '@/entities/defect';
import type { NewDefectFile } from '@/shared/types/defectFile';
import FixBySelector, { FixByValue } from '@/shared/ui/FixBySelector';

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
  const { data: defect } = useDefect(defectId ?? undefined);
  const fix = useFixDefect();

  const [fixBy, setFixBy] = useState<FixByValue>({ brigade_id: null, contractor_id: null });
  const [fixedAt, setFixedAt] = useState<dayjs.Dayjs | null>(null);
  const [files, setFiles] = useState<NewDefectFile[]>([]);

  useEffect(() => {
    if (defect && open) {
      setFixBy({ brigade_id: defect.brigade_id, contractor_id: defect.contractor_id });
      const baseDate = defect.fixed_at ? dayjs(defect.fixed_at) : dayjs();
      setFixedAt(baseDate.isBefore(dayjs(), 'day') ? dayjs() : baseDate);
    }
  }, [defect, open]);

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
      brigade_id: fixBy.brigade_id,
      contractor_id: fixBy.contractor_id,
      fixed_at: fixedAt ? fixedAt.format('YYYY-MM-DD') : null,
      attachments: files,
    });
    setFiles([]);
    setFixBy({ brigade_id: null, contractor_id: null });
    setFixedAt(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={fix.isPending}
      title={
        defect
          ? `Устранение дефекта с ID №${defect.id} от ${
              defect.received_at
                ? dayjs(defect.received_at).format('DD.MM.YYYY')
                : dayjs(defect.created_at).format('DD.MM.YYYY')
            }`
          : 'Устранение дефекта'
      }
    >
      <Form layout="vertical">
        <Form.Item label="Исполнитель">
          <FixBySelector
            value={fixBy}
            onChange={setFixBy}
            brigades={brigades}
            contractors={contractors}
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
