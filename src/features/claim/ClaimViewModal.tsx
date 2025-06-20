import React from 'react';
import { Modal, Skeleton, Typography } from 'antd';
import { useClaim, getClaimAttachments } from '@/entities/claim';
import { useQuery } from '@tanstack/react-query';
import ClaimFormAntd from './ClaimFormAntd';

interface Props {
  open: boolean;
  claimId: string | number | null;
  onClose: () => void;
}

export default function ClaimViewModal({ open, claimId, onClose }: Props) {
  const { data: claim } = useClaim(claimId ?? undefined);
  const { data: files = [] } = useQuery(['claim-files', claimId], () => getClaimAttachments(Number(claimId)), { enabled: !!claimId });
  if (!open || !claimId) return null;
  const titleText = claim
    ? `Претензия №${claim.number}`
    : 'Претензия';

  return (
    <Modal open={open} onCancel={onClose} footer={null} width="80%" title={<Typography.Title level={4} style={{ margin: 0 }}>{titleText}</Typography.Title>}>
      {claim ? (
        <ClaimFormAntd
          initialValues={claim as any}
          onCreated={onClose}
          viewMode
          defectIds={claim.defect_ids}
          attachments={files}
        />
      ) : (
        <Skeleton active />
      )}
    </Modal>
  );
}
