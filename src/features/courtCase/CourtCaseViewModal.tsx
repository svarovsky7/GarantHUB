import React from 'react';
import { Modal, Skeleton, Typography } from 'antd';
import { useCourtCase } from '@/entities/courtCase';
import CourtCaseFormAntdEdit from './CourtCaseFormAntdEdit';

interface Props {
  open: boolean;
  caseId: string | number | null;
  onClose: () => void;
}

/** Модальное окно просмотра судебного дела */
export default function CourtCaseViewModal({ open, caseId, onClose }: Props) {
  const { data: courtCase } = useCourtCase(caseId ?? undefined);
  const titleText = courtCase
    ? `Дело №${courtCase.id}`
    : 'Судебное дело';

  return (
    <Modal open={open} onCancel={onClose} footer={null} width="80%" title={<Typography.Title level={4} style={{ margin: 0 }}>{titleText}</Typography.Title>}>
      {caseId ? (
        courtCase ? (
          <CourtCaseFormAntdEdit caseId={caseId} onCancel={onClose} onSaved={onClose} embedded />
        ) : (
          <Skeleton active />
        )
      ) : null}
    </Modal>
  );
}
