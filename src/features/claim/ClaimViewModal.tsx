import React from 'react';
import { Modal, Skeleton, Typography } from 'antd';
import { useClaim, useClaimAttachments, signedUrl } from '@/entities/claim';
import TicketDefectsTable from '@/widgets/TicketDefectsTable';
import ClaimFormAntd from './ClaimFormAntd';

interface Props {
  open: boolean;
  claimId: string | number | null;
  onClose: () => void;
}

export default function ClaimViewModal({ open, claimId, onClose }: Props) {
  const { data: claim } = useClaim(claimId ?? undefined);
  const { data: files = [] } = useClaimAttachments(claim?.id);
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
          {files.length ? (
            <div style={{ marginTop: 16 }}>
              <b>Файлы:</b>
              <ul style={{ paddingLeft: 20 }}>
                {files.map((f: any) => (
                  <li key={f.id}>
                    <a
                      href="#"
                      onClick={async (e) => {
                        e.preventDefault();
                        const url = await signedUrl(
                          f.storage_path,
                          f.original_name ?? 'file',
                        );
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = f.original_name ?? 'file';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                      }}
                    >
                      {f.original_name ?? f.storage_path.split('/').pop()}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <Skeleton active />
      )}
    </Modal>
  );
}
