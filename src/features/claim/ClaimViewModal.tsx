import React from 'react';
import { Modal, Skeleton, Typography } from 'antd';
import { useClaim, signedUrl } from '@/entities/claim';
import ClaimFormAntdEdit from './ClaimFormAntdEdit';
import ClaimAttachmentsBlock from './ClaimAttachmentsBlock';
import TicketDefectsTable from '@/widgets/TicketDefectsTable';
import { useClaimAttachments } from './model/useClaimAttachments';

interface Props {
  open: boolean;
  claimId: string | number | null;
  onClose: () => void;
}

export default function ClaimViewModal({ open, claimId, onClose }: Props) {
  const { data: claim } = useClaim(claimId ?? undefined);
  const attachments = useClaimAttachments({ claim: claim as any });
  if (!open || !claimId) return null;
  const titleText = claim
    ? `Претензия №${claim.claim_no}`
    : 'Претензия';

  return (
    <Modal open={open} onCancel={onClose} footer={null} width="80%" title={<Typography.Title level={4} style={{ margin: 0 }}>{titleText}</Typography.Title>}>
      {claim ? (
        <>
          <ClaimFormAntdEdit
            embedded
            claimId={String(claimId)}
            onCancel={onClose}
            onSaved={onClose}
            showAttachments={false}
            attachmentsState={attachments}
          />
          <div style={{ marginTop: 16 }}>
            {claim.defect_ids?.length ? (
              <TicketDefectsTable defectIds={claim.defect_ids} />
            ) : (
              <Typography.Text>Дефекты не указаны</Typography.Text>
            )}
          </div>
          <ClaimAttachmentsBlock
            remoteFiles={attachments.remoteFiles}
            newFiles={attachments.newFiles.map((f) => f.file)}
            onFiles={attachments.addFiles}
            onRemoveRemote={attachments.removeRemote}
            onRemoveNew={attachments.removeNew}
            getSignedUrl={(path, name) => signedUrl(path, name)}
          />
        </>
      ) : (
        <Skeleton active />
      )}
    </Modal>
  );
}
