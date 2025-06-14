import React from 'react';
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
  React.useEffect(() => {
    console.log('[CourtCaseViewModal] open', open, 'caseId', caseId);
  }, [open, caseId]);
  React.useEffect(() => {
    console.log('[CourtCaseViewModal] case data', courtCase);
  }, [courtCase]);
  const titleText = courtCase ? `Дело №${courtCase.id}` : 'Дело';

  if (!caseId) return null;

  return (
    <Modal
      destroyOnClose
      open={open}
      onCancel={onClose}
      footer={null}
      width="80%"
      title={<Typography.Title level={4} style={{ margin: 0 }}>{titleText}</Typography.Title>}
    >
      {courtCase ? (
        <CourtCaseFormAntdEdit
          key={String(caseId)}
          caseId={String(caseId)}
          caseData={courtCase}
          onCancel={onClose}
          onSaved={onClose}
          embedded
        />
      ) : null}
    </Modal>
  );
}
