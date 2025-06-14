import React from 'react';
import dayjs from 'dayjs';
import { Modal, Typography, Skeleton } from 'antd';
import { useDefect } from '@/entities/defect';

interface Props {
  open: boolean;
  defectId: number | null;
  onClose: () => void;
}

/** Модальное окно просмотра дефекта */
export default function DefectViewModal({ open, defectId, onClose }: Props) {
  const { data: defect, isLoading } = useDefect(defectId ?? undefined);
  if (!defectId) return null;
  const title = defect ? `Дефект №${defect.id}` : 'Дефект';
  return (
    <Modal open={open} onCancel={onClose} footer={null} width="60%"
      title={<Typography.Title level={4} style={{ margin: 0 }}>{title}</Typography.Title>}>
      {isLoading || !defect ? (
        <Skeleton active />
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          <Typography.Text><b>Описание:</b> {defect.description}</Typography.Text>
          <Typography.Text>
            <b>Стоимость устранения:</b> {defect.fix_cost ?? '—'}
          </Typography.Text>
          <Typography.Text>
            <b>Дата создания:</b>{' '}
            {defect.created_at ? dayjs(defect.created_at).format('DD.MM.YYYY') : '—'}
          </Typography.Text>
        </div>
      )}
    </Modal>
  );
}
