import React from 'react';
import dayjs from 'dayjs';
import { Modal, Typography } from 'antd';
import CourtCaseFormAntdEdit from './CourtCaseFormAntdEdit';
import { useCourtCase } from '@/entities/courtCase';

interface Props {
  open: boolean;
  caseId: string | number | null;
  onClose: () => void;
}

/** Модальное окно просмотра судебного дела */
export default function CourtCaseViewModal({ open, caseId, onClose }: Props) {
  const { data: courtCase } = useCourtCase(caseId || undefined);
  const titleText = courtCase
    ? `Дело №${courtCase.number} от ${dayjs(courtCase.date).format('DD.MM.YYYY')}`
    : 'Дело';

  if (!caseId) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="80%"
      destroyOnHidden
      title={<Typography.Title level={4} style={{ margin: 0 }}>{titleText}</Typography.Title>}
    >
      {courtCase ? (
        <CourtCaseFormAntdEdit caseId={String(caseId)} onCancel={onClose} onSaved={onClose} embedded />
      ) : null}
    </Modal>
  );
}
