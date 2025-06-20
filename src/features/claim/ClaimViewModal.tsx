import React from 'react';
import { Modal, Skeleton, Typography } from 'antd';
import { useClaim, useClaimAttachments } from '@/entities/claim';
import TicketDefectsTable from '@/widgets/TicketDefectsTable';
import ClaimFormAntd from './ClaimFormAntd';
import AttachmentList from '@/shared/ui/AttachmentList';

interface Props {
  open: boolean;
  claimId: string | number | null;
  onClose: () => void;
}

export default function ClaimViewModal({ open, claimId, onClose }: Props) {
  const { data: claim } = useClaim(claimId ?? undefined);
  const { data: attachments = [] } = useClaimAttachments(claimId ?? undefined);
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
            <div style={{ marginTop: 16 }}>
              <TicketDefectsTable defectIds={claim.defect_ids} />
            </div>
          ) : null}
          {attachments.length ? (
            <div style={{ marginTop: 16 }}>
              <Typography.Text strong>Файлы:</Typography.Text>
              <AttachmentList
                files={attachments.map((a) => ({
                  id: a.id,
                  path: a.storage_path,
                  url: a.file_url,
                  type: a.file_type,
                  original_name: a.original_name ?? null,
                  attachment_type_id: a.attachment_type_id ?? null,
                }))}
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
