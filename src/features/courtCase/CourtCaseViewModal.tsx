import React from 'react';
import { Modal, Typography, Skeleton } from 'antd';
import { useCourtCase } from '@/entities/courtCase';
import CourtCaseFormAntdEdit from './CourtCaseFormAntdEdit';

interface Props {
  open: boolean;
  caseId: string | number | null;
  onClose: () => void;
}

/** Модальное окно просмотра судебного дела */
export default function CourtCaseViewModal({ open, caseId, onClose }: Props) {
  const { data: courtCase } = useCourtCase(caseId || undefined);
  if (!caseId) return null;
  const titleText = courtCase ? `Дело №${courtCase.number}` : 'Судебное дело';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="80%"
      destroyOnClose
      title={<Typography.Title level={4} style={{ margin: 0 }}>{titleText}</Typography.Title>}
    >
      {courtCase ? (
        <CourtCaseFormAntdEdit caseId={String(caseId)} onCancel={onClose} onSaved={onClose} embedded />
      ) : (
        <Skeleton active />
      )}
    </Modal>
  );
}
