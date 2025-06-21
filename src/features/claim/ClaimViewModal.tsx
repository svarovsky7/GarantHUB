import React from 'react';
import { Modal, Skeleton, Typography } from 'antd';
import { useClaim, signedUrl } from '@/entities/claim';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
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
    ? `Претензия №${claim.claim_no}`
    : 'Претензия';

  return (
    <Modal open={open} onCancel={onClose} footer={null} width="80%" title={<Typography.Title level={4} style={{ margin: 0 }}>{titleText}</Typography.Title>}>
      {claim ? (
        <>
          <ClaimFormAntd
            initialValues={claim as any}
            onCreated={onClose}
            showDefectsForm={false}
          />
          {claim.ticket_ids?.length ? (
            <div style={{ marginTop: 16 }}>
              <TicketDefectsTable defectIds={claim.ticket_ids} />
            </div>
          ) : null}
          {claim.attachments?.length ? (
            <div style={{ marginTop: 16 }}>
              <AttachmentEditorTable
                remoteFiles={claim.attachments.map((f) => ({
                  id: String(f.id),
                  name: f.original_name ?? f.name,
                  path: f.path ?? f.storage_path,
                  mime: f.type,
                }))}
                getSignedUrl={(path, name) => signedUrl(path, name)}
              />
            </div>
          ) : null}
        </>
      ) : (
        <Skeleton active />
      )}
    </Modal>
  );
}
