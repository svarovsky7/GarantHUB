import React from "react";
import { Modal, Skeleton, Typography, Button } from "antd";
import {
  useClaim,
  useClaimAll,
  signedUrl,
  signedUrlForPreview,
  closeDefectsForClaim,
} from "@/entities/claim";
import ClaimFormAntdEdit from "./ClaimFormAntdEdit";
import ClaimAttachmentsBlock from "./ClaimAttachmentsBlock";
import TicketDefectsEditorTable from "@/widgets/TicketDefectsEditorTable";
import DefectAddModal from "@/features/defect/DefectAddModal";
import DefectViewModal from "@/features/defect/DefectViewModal";
import ClaimRelatedClaimsBlock from "./ClaimRelatedClaimsBlock";
import dayjs from "dayjs";
import {
  useCreateDefects,
  useDeleteDefect,
  useDefectsWithNames,
  useUpdateDefect,
  removeDefectAttachmentsBulk,
  type NewDefect,
} from "@/entities/defect";
import { useDefectTypes } from "@/entities/defectType";
import { useDefectStatuses } from "@/entities/defectStatus";
import { useBrigades } from "@/entities/brigade";
import { useContractors } from "@/entities/contractor";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabaseClient";
import {
  addDefectAttachments,
  updateAttachmentDescription,
} from "@/entities/attachment";
import { useClaimAttachments } from "./model/useClaimAttachments";
import type { ClaimFormAntdEditRef } from "@/shared/types/claimFormAntdEditRef";
import { useAuthStore } from "@/shared/store/authStore";
import { useRolePermission } from "@/entities/rolePermission";
import type { RoleName } from "@/shared/types/rolePermission";
import FilePreviewModal from "@/shared/ui/FilePreviewModal";
import type { PreviewFile } from "@/shared/types/previewFile";
import type { NewDefectFile } from "@/shared/types/defectFile";
import type { RemoteClaimFile } from "@/shared/types/claimFile";

interface Props {
  open: boolean;
  claimId: string | number | null;
  onClose: () => void;
}

export default function ClaimViewModal({ open, claimId, onClose }: Props) {
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const claimAssigned = useClaim(claimId ?? undefined);
  const claimAll = useClaimAll(claimId ?? undefined);
  const claim = perm?.only_assigned_project
    ? claimAssigned.data
    : claimAll.data;
  const attachments = useClaimAttachments({ claim: claim as any });
  const formRef = React.useRef<ClaimFormAntdEditRef>(null);
  const createDefs = useCreateDefects();
  const deleteDef = useDeleteDefect();
  const updateDef = useUpdateDefect();
  const { data: defectTypes = [] } = useDefectTypes();
  const { data: defectStatuses = [] } = useDefectStatuses();
  const { data: brigades = [] } = useBrigades();
  const { data: contractors = [] } = useContractors();
  const qc = useQueryClient();
  const [defectIds, setDefectIds] = React.useState<number[]>([]);
  const [newDefs, setNewDefs] = React.useState<
    Array<{ tmpId: number } & NewDefect>
  >([]);
  const [removedIds, setRemovedIds] = React.useState<number[]>([]);
  const [editedDefs, setEditedDefs] = React.useState<
    Record<number, Partial<NewDefect>>
  >({});
  const [showAdd, setShowAdd] = React.useState(false);
  const [viewDefId, setViewDefId] = React.useState<number | null>(null);
  const [previewFile, setPreviewFile] = React.useState<PreviewFile | null>(
    null,
  );
  const [defectFiles, setDefectFiles] = React.useState<
    Record<number, NewDefectFile[]>
  >({});
  const [defectRemoteFiles, setDefectRemoteFiles] = React.useState<
    Record<number, RemoteClaimFile[]>
  >({});
  const [defectRemovedMap, setDefectRemovedMap] = React.useState<
    Record<number, number[]>
  >({});
  const [defectChangedDesc, setDefectChangedDesc] = React.useState<
    Record<number, string>
  >({});
  const defectDescInit = React.useRef<Record<number, string>>({});
  const tmpIdRef = React.useRef(-1);

  const lastClaimIdRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!claim || !open) return;
    const ids = claim.defect_ids || [];
    const changed =
      lastClaimIdRef.current !== claim.id ||
      ids.length !== defectIds.length ||
      ids.some((d, i) => d !== defectIds[i]);
    if (changed) {
      lastClaimIdRef.current = claim.id;
      setDefectIds(ids);
      setNewDefs([]);
      setRemovedIds([]);
    }
  }, [claim, open]);

  React.useEffect(() => {
    if (!open || defectIds.length === 0) {
      setDefectRemoteFiles({});
      return;
    }
    const load = async () => {
      const { data, error } = await supabase
        .from("defect_attachments")
        .select(
          "defect_id, attachments(id, storage_path, file_url:path, file_type:mime_type, original_name, description)",
        )
        .in("defect_id", defectIds);
      if (error) return;
      const map: Record<number, RemoteClaimFile[]> = {};
      (data ?? []).forEach((r: any) => {
        const a = r.attachments;
        if (!a) return;
        const name =
          a.original_name ?? a.storage_path.split("/").pop() ?? "file";
        const file: RemoteClaimFile = {
          id: a.id,
          name,
          original_name: a.original_name ?? null,
          path: a.storage_path,
          url: a.file_url,
          mime_type: a.file_type,
          description: a.description ?? null,
        };
        if (!map[r.defect_id]) map[r.defect_id] = [];
        map[r.defect_id].push(file);
        defectDescInit.current[a.id] = a.description ?? "";
      });
      setDefectRemoteFiles(map);
      setDefectChangedDesc({});
      setDefectRemovedMap({});
    };
    load();
  }, [open, defectIds]);

  React.useEffect(() => {
    if (!open) {
      lastClaimIdRef.current = null;
      setDefectIds([]);
      setNewDefs([]);
      setRemovedIds([]);
      attachments.reset();
      setDefectFiles({});
      setDefectRemoteFiles({});
      setDefectRemovedMap({});
      setDefectChangedDesc({});
      defectDescInit.current = {};
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

  const statusMap = React.useMemo(() => {
    const map: Record<number, { name: string; color: string | null }> = {};
    defectStatuses.forEach((s) => {
      map[s.id] = { name: s.name, color: s.color };
    });
    return map;
  }, [defectStatuses]);

  const getFixByName = React.useCallback(
    (d: { brigade_id: number | null; contractor_id: number | null }) => {
      if (d.brigade_id)
        return brigades.find((b) => b.id === d.brigade_id)?.name || "Бригада";
      if (d.contractor_id)
        return (
          contractors.find((c) => c.id === d.contractor_id)?.name || "Подрядчик"
        );
      return "—";
    },
    [brigades, contractors],
  );

  const displayDefs = React.useMemo(() => {
    const existing = loadedDefs.map((d) => {
      const changes = editedDefs[d.id] ?? {};
      const rec = { ...d, ...changes } as any;
      return { ...rec, fixByName: getFixByName(rec) };
    });
    const created = newDefs.map((d) => ({
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
        d.type_id != null ? (defectTypeMap[d.type_id] ?? null) : null,
      defectStatusName:
        d.status_id != null ? (statusMap[d.status_id]?.name ?? null) : null,
      defectStatusColor:
        d.status_id != null ? (statusMap[d.status_id]?.color ?? null) : null,
      fixByName: getFixByName(d),
    }));
    return [...existing, ...created];
  }, [loadedDefs, newDefs, defectTypeMap, statusMap, getFixByName, editedDefs]);

  const handleRemove = (id: number) => {
    if (id < 0) {
      setNewDefs((p) => p.filter((d) => d.tmpId !== id));
      setDefectFiles((p) => {
        const { [id]: _omit, ...rest } = p;
        return rest;
      });
    } else {
      setDefectIds((p) => p.filter((d) => d !== id));
      setRemovedIds((p) => [...p, id]);
    }
  };

  const handleAddDefs = (defs: NewDefect[]) => {
    const unitId = claim?.unit_ids?.[0] ?? null;
    const userId = useAuthStore.getState().profile?.id ?? null;
    setNewDefs((p) => [
      ...p,
      ...defs.map((d) => ({
        ...d,
        unit_id: unitId,
        created_by: userId,
        engineer_id: null,
        tmpId: tmpIdRef.current--,
      })),
    ]);
    setShowAdd(false);
  };

  const changeDefFiles = (id: number, files: NewDefectFile[]) => {
    setDefectFiles((p) => ({ ...p, [id]: files }));
  };

  const removeDefRemote = (defId: number, fileId: string) => {
    setDefectRemoteFiles((p) => ({
      ...p,
      [defId]: (p[defId] ?? []).filter((f) => String(f.id) !== fileId),
    }));
    setDefectRemovedMap((prev) => ({
      ...prev,
      [defId]: [...(prev[defId] ?? []), Number(fileId)],
    }));
    setDefectChangedDesc((prev) => {
      const { [Number(fileId)]: _omit, ...rest } = prev;
      return rest;
    });
  };

  const changeDefRemoteDesc = (defId: number, fileId: string, desc: string) => {
    setDefectRemoteFiles((p) => ({
      ...p,
      [defId]: (p[defId] ?? []).map((f) =>
        String(f.id) === fileId ? { ...f, description: desc } : f,
      ),
    }));
    setDefectChangedDesc((prev) => {
      const init = defectDescInit.current[Number(fileId)] ?? "";
      if (init === desc) {
        const { [Number(fileId)]: _om, ...rest } = prev;
        return rest;
      }
      return { ...prev, [Number(fileId)]: desc };
    });
  };

  const handleChangeDef = (
    id: number,
    field: keyof NewDefect | "id",
    value: any,
  ) => {
    if (id < 0) {
      setNewDefs((p) =>
        p.map((d) => (d.tmpId === id ? { ...d, [field]: value } : d)),
      );
    } else {
      setEditedDefs((p) => ({
        ...p,
        [id]: { ...(p[id] ?? {}), [field]: value },
      }));
    }
  };

  const handleSaved = async () => {
    if (!claim) return;
    try {
      const createdIds = newDefs.length
        ? await createDefs.mutateAsync(newDefs.map(({ tmpId, ...d }) => d))
        : [];
      if (createdIds.length) {
        await supabase.from("claim_defects").insert(
          createdIds.map((id) => ({
            claim_id: claim.id,
            defect_id: id,
            pre_trial_claim: claim.pre_trial_claim ?? false,
          })),
        );
        await closeDefectsForClaim(claim.id, claim.claim_status_id ?? null);
        for (let i = 0; i < createdIds.length; i += 1) {
          const filesFor = defectFiles[newDefs[i].tmpId] ?? [];
          if (filesFor.length) {
            const uploaded = await addDefectAttachments(
              filesFor.map((f) => ({
                file: f.file,
                type_id: null,
                description: f.description,
              })),
              createdIds[i],
            );
            if (uploaded.length) {
              await supabase.from("defect_attachments").insert(
                uploaded.map((u: any) => ({
                  defect_id: createdIds[i],
                  attachment_id: u.id,
                })),
              );
            }
          }
        }
      }
      // upload files for existing defects
      for (const id of defectIds) {
        if (id < 0) continue;
        const filesFor = defectFiles[id] ?? [];
        if (filesFor.length) {
          const uploaded = await addDefectAttachments(
            filesFor.map((f) => ({
              file: f.file,
              type_id: null,
              description: f.description,
            })),
            id,
          );
          if (uploaded.length) {
            await supabase
              .from("defect_attachments")
              .insert(
                uploaded.map((u: any) => ({
                  defect_id: id,
                  attachment_id: u.id,
                })),
              );
          }
        }
      }
      if (removedIds.length) {
        await supabase
          .from("claim_defects")
          .delete()
          .eq("claim_id", claim.id)
          .in("defect_id", removedIds);
        for (const id of removedIds) {
          await deleteDef.mutateAsync(id);
        }
        await closeDefectsForClaim(claim.id, claim.claim_status_id ?? null);
      }
      for (const [defId, ids] of Object.entries(defectRemovedMap)) {
        if (ids.length) {
          await removeDefectAttachmentsBulk(Number(defId), ids as number[]);
        }
      }
      if (Object.keys(defectChangedDesc).length) {
        await Promise.all(
          Object.entries(defectChangedDesc).map(([id, val]) =>
            updateAttachmentDescription(Number(id), val),
          ),
        );
      }
      const updates = Object.entries(editedDefs).map(([id, upd]) => ({
        id: Number(id),
        updates: upd,
      }));
      if (updates.length) {
        await Promise.all(updates.map((u) => updateDef.mutateAsync(u)));
      }
      qc.invalidateQueries({ queryKey: ["defects"] });
      qc.invalidateQueries({ queryKey: ["claims"] });
      qc.invalidateQueries({ queryKey: ["claims", claim.id] });
      qc.invalidateQueries({ queryKey: ["claim-all", claim.id] });
      qc.invalidateQueries({ queryKey: ["claims-simple"] });
      qc.invalidateQueries({ queryKey: ["claims-simple-all"] });
      qc.invalidateQueries({ queryKey: ["claims-all"] });
      setEditedDefs({});
      setNewDefs([]);
      setRemovedIds([]);
      setDefectFiles({});
      setDefectRemovedMap({});
      setDefectChangedDesc({});
      defectDescInit.current = Object.fromEntries(
        Object.values(defectRemoteFiles)
          .flat()
          .map((f) => [Number(f.id), f.description ?? ""]),
      );
      onClose();
    } catch (e) {
      console.error(e);
    }
  };
  if (!open || !claimId) return null;
  const titleText = claim ? `Претензия №${claim.claim_no}` : "Претензия";

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        width="80%"
        title={
          <Typography.Title level={4} style={{ margin: 0 }}>
            {titleText}
          </Typography.Title>
        }
      >
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
                <TicketDefectsEditorTable
                  items={displayDefs}
                  defectTypes={defectTypes}
                  statuses={defectStatuses}
                  brigades={brigades}
                  contractors={contractors}
                  onChange={handleChangeDef}
                  onRemove={handleRemove}
                  onView={setViewDefId}
                  fileMap={defectFiles}
                  remoteFileMap={defectRemoteFiles}
                  onFilesChange={changeDefFiles}
                  onRemoveRemoteFile={removeDefRemote}
                  onDescRemoteFile={changeDefRemoteDesc}
                  getSignedUrl={(p, n) => signedUrl(p, n)}
                  getSignedUrlForPreview={(p) => signedUrlForPreview(p)}
                  onPreview={(f) => setPreviewFile(f)}
                />
              ) : (
                <Typography.Text>Дефекты не указаны</Typography.Text>
              )}
              <div style={{ textAlign: "right", marginTop: 8 }}>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => setShowAdd(true)}
                >
                  Добавить дефекты
                </Button>
              </div>
            </div>
            <ClaimRelatedClaimsBlock claimId={claim.id} />
            <ClaimAttachmentsBlock
              remoteFiles={attachments.remoteFiles}
              newFiles={attachments.newFiles}
              onFiles={attachments.addFiles}
              onRemoveRemote={attachments.removeRemote}
              onRemoveNew={attachments.removeNew}
              onDescRemote={attachments.setRemoteDescription}
              onDescNew={attachments.setDescription}
              getSignedUrl={(path, name) => signedUrl(path, name)}
              getSignedUrlForPreview={(path) => signedUrlForPreview(path)}
              onPreview={(f) => setPreviewFile(f)}
            />
            <div style={{ textAlign: "right", marginTop: 16 }}>
              <Button
                style={{ marginRight: 8 }}
                onClick={onClose}
                disabled={formRef.current?.isSubmitting}
              >
                Отмена
              </Button>
              <Button
                type="primary"
                onClick={() => formRef.current?.submit()}
                loading={formRef.current?.isSubmitting}
              >
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
          defaultReceivedAt={
            claim?.accepted_on ? dayjs(claim.accepted_on) : null
          }
          onClose={() => setShowAdd(false)}
          onSubmit={handleAddDefs}
        />
      </Modal>
      <DefectViewModal
        open={viewDefId !== null}
        defectId={viewDefId}
        onClose={() => setViewDefId(null)}
      />
      <FilePreviewModal
        open={previewFile !== null}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </>
  );
}
