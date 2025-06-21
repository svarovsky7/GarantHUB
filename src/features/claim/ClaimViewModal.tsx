import React from 'react';
import { Modal, Skeleton, Typography } from 'antd';
import { useClaim, useRemoveClaimAttachment } from '@/entities/claim';
import type { RemoteClaimFile } from '@/shared/types/claimFile';
import ClaimAttachmentsBlock from './ClaimAttachmentsBlock';
import TicketDefectsTable from '@/widgets/TicketDefectsTable';
import ClaimFormAntd from './ClaimFormAntd';

interface Props {
  open: boolean;
  claimId: string | number | null;
  onClose: () => void;
}

export default function ClaimViewModal({ open, claimId, onClose }: Props) {
  const { data: claim } = useClaim(claimId ?? undefined);
  const removeAtt = useRemoveClaimAttachment();
  const [files, setFiles] = React.useState<RemoteClaimFile[]>([]);

  React.useEffect(() => {
    setFiles(
      claim?.attachments?.map((f) => ({
        id: f.id,
        name: f.original_name ?? f.name,
        path: f.path ?? f.storage_path,
        mime_type: f.type as any,
      })) || [],
    );
  }, [claim]);

  const handleRemove = async (id: string) => {
    await removeAtt.mutateAsync({
      claimId: claim!.id,
      attachmentId: Number(id),
    });
    setFiles((p) => p.filter((f) => String(f.id) !== id));
  };
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
            showAttachments={false}
          />
          {claim.ticket_ids?.length ? (
            <div style={{ marginTop: 16 }}>
              <TicketDefectsTable defectIds={claim.ticket_ids} />
            </div>
          ) : null}
          {files.length ? (
            <div style={{ marginTop: 16 }}>
              <ClaimAttachmentsBlock
                remoteFiles={files}
                onRemoveRemote={handleRemove}
                showUpload={false}
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
