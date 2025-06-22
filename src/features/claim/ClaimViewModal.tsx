import React from 'react';
import { Modal, Skeleton, Typography, Button } from 'antd';
import { useClaim, signedUrl } from '@/entities/claim';
import ClaimFormAntdEdit from './ClaimFormAntdEdit';
import ClaimAttachmentsBlock from './ClaimAttachmentsBlock';
import TicketDefectsTable from '@/widgets/TicketDefectsTable';
import DefectAddModal from '@/features/defect/DefectAddModal';
import { useCreateDefects, useDeleteDefect, useDefectsWithNames, type NewDefect } from '@/entities/defect';
import { useDefectTypes } from '@/entities/defectType';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useClaimAttachments } from './model/useClaimAttachments';
import type { ClaimFormAntdEditRef } from '@/shared/types/claimFormAntdEditRef';

interface Props {
  open: boolean;
  claimId: string | number | null;
  onClose: () => void;
}

export default function ClaimViewModal({ open, claimId, onClose }: Props) {
  const { data: claim } = useClaim(claimId ?? undefined);
  const attachments = useClaimAttachments({ claim: claim as any });
  const formRef = React.useRef<ClaimFormAntdEditRef>(null);
  const createDefs = useCreateDefects();
  const deleteDef = useDeleteDefect();
  const { data: defectTypes = [] } = useDefectTypes();
  const qc = useQueryClient();
  const [defectIds, setDefectIds] = React.useState<number[]>([]);
  const [newDefs, setNewDefs] = React.useState<Array<{ tmpId: number } & NewDefect>>([]);
  const [removedIds, setRemovedIds] = React.useState<number[]>([]);
  const [showAdd, setShowAdd] = React.useState(false);
  const tmpIdRef = React.useRef(-1);

  const lastClaimIdRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (claim && open && lastClaimIdRef.current !== claim.id) {
      lastClaimIdRef.current = claim.id;
      setDefectIds(claim.defect_ids || []);
      setNewDefs([]);
      setRemovedIds([]);
    }
  }, [claim, open]);

  React.useEffect(() => {
    if (!open) {
      lastClaimIdRef.current = null;
      setDefectIds([]);
      setNewDefs([]);
      setRemovedIds([]);
      attachments.reset();
    }
  }, [open]);

  const { data: loadedDefs = [] } = useDefectsWithNames(defectIds);

  const defectTypeMap = React.useMemo(() => {
    const map: Record<number, string> = {};
    defectTypes.forEach((t) => {
      map[t.id] = t.name;
    });
    return map;
  }, [defectTypes]);

  const displayDefs = React.useMemo(() => {
    return [
      ...loadedDefs,
      ...newDefs.map((d) => ({
        id: d.tmpId,
        description: d.description,
        type_id: d.type_id,
        status_id: d.status_id,
        brigade_id: d.brigade_id,
        contractor_id: d.contractor_id,
        is_warranty: d.is_warranty,
        received_at: d.received_at,
        fixed_at: d.fixed_at,
        fixed_by: null,
        defectTypeName:
          d.type_id != null ? defectTypeMap[d.type_id] ?? null : null,
        defectStatusName: null,
        defectStatusColor: null,
      })),
    ];
  }, [loadedDefs, newDefs, defectTypeMap]);

  const handleRemove = (id: number) => {
    if (id < 0) {
      setNewDefs((p) => p.filter((d) => d.tmpId !== id));
    } else {
      setDefectIds((p) => p.filter((d) => d !== id));
      setRemovedIds((p) => [...p, id]);
    }
  };

  const handleAddDefs = (defs: NewDefect[]) => {
    setNewDefs((p) => [
      ...p,
      ...defs.map((d) => ({ ...d, tmpId: tmpIdRef.current-- })),
    ]);
    setShowAdd(false);
  };

  const handleSaved = async (isOfficial: boolean) => {
    if (!claim) return;
    try {
      const createdIds = newDefs.length
        ? await createDefs.mutateAsync(
            newDefs.map(({ tmpId, ...d }) => d),
          )
        : [];
      if (createdIds.length) {
        await supabase.from('claim_defects').insert(
          createdIds.map((id) => ({
            claim_id: claim.id,
            defect_id: id,
            is_official: isOfficial,
          })),
        );
      }
      if (removedIds.length) {
        await supabase
          .from('claim_defects')
          .delete()
          .eq('claim_id', claim.id)
          .in('defect_id', removedIds);
        for (const id of removedIds) {
          await deleteDef.mutateAsync(id);
        }
      }
      qc.invalidateQueries({ queryKey: ['defects'] });
      qc.invalidateQueries({ queryKey: ['claims'] });
      qc.invalidateQueries({ queryKey: ['claims', claim.id] });
      onClose();
    } catch (e) {
      console.error(e);
    }
  };
  if (!open || !claimId) return null;
  const titleText = claim
    ? `Претензия №${claim.claim_no}`
    : 'Претензия';

  return (
    <Modal open={open} onCancel={onClose} footer={null} width="80%" title={<Typography.Title level={4} style={{ margin: 0 }}>{titleText}</Typography.Title>}>
      {claim ? (
        <>
          <ClaimFormAntdEdit
            ref={formRef}
            embedded
            claimId={String(claimId)}
            onCancel={onClose}
            onSaved={handleSaved}
            showAttachments={false}
            hideActions
            attachmentsState={attachments}
          />
          <div style={{ marginTop: 16 }}>
            {displayDefs.length ? (
              <TicketDefectsTable items={displayDefs} onRemove={handleRemove} />
            ) : (
              <Typography.Text>Дефекты не указаны</Typography.Text>
            )}
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <Button size="small" type="primary" onClick={() => setShowAdd(true)}>
                Добавить дефекты
              </Button>
            </div>
          </div>
          <ClaimAttachmentsBlock
            remoteFiles={attachments.remoteFiles}
            newFiles={attachments.newFiles.map((f) => f.file)}
            onFiles={attachments.addFiles}
            onRemoveRemote={attachments.removeRemote}
            onRemoveNew={attachments.removeNew}
            getSignedUrl={(path, name) => signedUrl(path, name)}
          />
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Button style={{ marginRight: 8 }} onClick={onClose} disabled={formRef.current?.isSubmitting}>
              Отмена
            </Button>
            <Button type="primary" onClick={() => formRef.current?.submit()} loading={formRef.current?.isSubmitting}>
              Сохранить
            </Button>
          </div>
        </>
      ) : (
        <Skeleton active />
      )}
      <DefectAddModal
        open={showAdd}
        projectId={claim?.project_id}
        onClose={() => setShowAdd(false)}
        onSubmit={handleAddDefs}
      />
    </Modal>
  );
}
