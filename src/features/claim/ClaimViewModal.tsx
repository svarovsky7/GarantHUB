import React from 'react';
import { Modal, Skeleton, Typography } from 'antd';
import { useClaim } from '@/entities/claim';
import ClaimFormAntdEdit from './ClaimFormAntdEdit';
import TicketDefectsTable from '@/widgets/TicketDefectsTable';

interface Props {
  open: boolean;
  claimId: string | number | null;
  onClose: () => void;
}

export default function ClaimViewModal({ open, claimId, onClose }: Props) {
  const { data: claim } = useClaim(claimId ?? undefined);
  if (!open || !claimId) return null;
  const titleText = claim
    ? `Претензия №${claim.claim_no}`
    : 'Претензия';

  return (
    <Modal open={open} onCancel={onClose} footer={null} width="80%" title={<Typography.Title level={4} style={{ margin: 0 }}>{titleText}</Typography.Title>}>
      {claim ? (
        <>
          <ClaimFormAntdEdit embedded claimId={String(claimId)} onCancel={onClose} onSaved={onClose} />
          <div style={{ marginTop: 16 }}>
            {claim.defect_ids?.length ? (
              <TicketDefectsTable defectIds={claim.defect_ids} />
            ) : (
              <Typography.Text>Дефекты не указаны</Typography.Text>
            )}
          </div>
        </>
      ) : (
        <Skeleton active />
      )}
    </Modal>
  );
}
