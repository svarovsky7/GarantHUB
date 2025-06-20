import React from 'react';
import { Modal, Skeleton, Typography } from 'antd';
import { useClaim } from '@/entities/claim';
import TicketDefectsTable from '@/widgets/TicketDefectsTable';
import ClaimFormAntd from './ClaimFormAntd';

interface Props {
  open: boolean;
  claimId: string | number | null;
  onClose: () => void;
}

export default function ClaimViewModal({ open, claimId, onClose }: Props) {
  const { data: claim } = useClaim(claimId ?? undefined);
  if (!open || !claimId) return null;
  const titleText = claim
    ? `Претензия №${claim.number}`
    : 'Претензия';

  return (
    <Modal open={open} onCancel={onClose} footer={null} width="80%" title={<Typography.Title level={4} style={{ margin: 0 }}>{titleText}</Typography.Title>}>
      {claim ? (
        <>
          <ClaimFormAntd initialValues={claim as any} onCreated={onClose} />
          {claim.defect_ids?.length ? (
            <div style={{ marginTop: 16, overflowX: 'auto' }}>
              <TicketDefectsTable defectIds={claim.defect_ids} />
            </div>
          ) : null}
        </>
      ) : (
        <Skeleton active />
      )}
    </Modal>
  );
}
