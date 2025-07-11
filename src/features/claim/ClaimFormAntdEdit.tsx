import React, { useEffect, useImperativeHandle } from "react";
import type { Dayjs } from "dayjs";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Button,
  Skeleton,
  Switch,
  Tooltip,
  Space,
  Popconfirm,
  Modal,
} from "antd";
import {
  useClaim,
  useClaimAll,
  useUpdateClaim,
  useAddClaimAttachments,
  removeClaimAttachmentsBulk,
  signedUrl,
  markClaimDefectsPreTrial,
} from "@/entities/claim";
import { updateAttachmentDescription } from "@/entities/attachment";
import { supabase } from "@/shared/api/supabaseClient";
import { useVisibleProjects } from "@/entities/project";
import {
  useUnitsByProject,
  useUnitsByIds,
  useLockedUnitIds,
} from "@/entities/unit";
import { useUsers } from "@/entities/user";
import { useClaimStatuses } from "@/entities/claimStatus";

import { useCaseUids } from "@/entities/courtCaseUid";
import { useNotify } from "@/shared/hooks/useNotify";
import { useProjectId } from "@/shared/hooks/useProjectId";
import { useAuthStore } from "@/shared/store/authStore";
import { useRolePermission } from "@/entities/rolePermission";
import type { RoleName } from "@/shared/types/rolePermission";
import { PRETRIAL_FLAG } from "@/shared/types/rolePermission";
import { useChangedFields } from "@/shared/hooks/useChangedFields";
import AttachmentEditorTable from "@/shared/ui/AttachmentEditorTable";
import FileDropZone from "@/shared/ui/FileDropZone";
import { useClaimAttachments } from "./model/useClaimAttachments";
import type { RemoteClaimFile } from "@/shared/types/claimFile";
import type { ClaimFormAntdEditRef } from "@/shared/types/claimFormAntdEditRef";

export interface ClaimFormAntdEditProps {
  claimId: string | number;
  onCancel?: () => void;
  /** Вызывается после успешного сохранения формы */
  onSaved?: () => void;
  embedded?: boolean;
  /** Показывать блок работы с файлами */
  showAttachments?: boolean;
  /** Внешнее состояние вложений */
  attachmentsState?: ReturnType<typeof useClaimAttachments>;
  /** Скрыть кнопки действия */
  hideActions?: boolean;
}

export interface ClaimFormAntdEditValues {
  project_id: number | null;
  unit_ids: number[];
  building: string | null;
  claim_status_id: number | null;
  claim_no: string;
  claimed_on: Dayjs | null;
  accepted_on: Dayjs | null;
  registered_on: Dayjs | null;
  engineer_id: string | null;
  owner: string | null;
  case_uid_id: number | null;
  pre_trial_claim: boolean;
  description: string | null;
}

const ClaimFormAntdEdit = React.forwardRef<
  ClaimFormAntdEditRef,
  ClaimFormAntdEditProps
>(function ClaimFormAntdEdit(
  {
    claimId,
    onCancel,
    onSaved,
    embedded = false,
    showAttachments = true,
    attachmentsState,
    hideActions = false,
  }: ClaimFormAntdEditProps,
  ref,
) {
  const [form] = Form.useForm<ClaimFormAntdEditValues>();
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const allowPretrial = perm?.pages.includes(PRETRIAL_FLAG);
  const claimAssigned = useClaim(claimId);
  const claimAll = useClaimAll(claimId);
  const claim = perm?.only_assigned_project
    ? claimAssigned.data
    : claimAll.data;
  const { data: projects = [] } = useVisibleProjects();
  const globalProjectId = useProjectId();
  const projectIdWatch = Form.useWatch("project_id", form);
  const projectId =
    projectIdWatch != null ? Number(projectIdWatch) : globalProjectId;
  const { data: units = [] } = useUnitsByProject(projectId);
  const { data: users = [] } = useUsers();
  const { data: statuses = [] } = useClaimStatuses();
  const { data: caseUids = [] } = useCaseUids();
  const update = useUpdateClaim();
  const addAtt = useAddClaimAttachments();
  const notify = useNotify();
  const userId = useAuthStore((s) => s.profile?.id) ?? null;
  const attachments =
    attachmentsState ?? useClaimAttachments({ claim: claim as any });
  const { changedFields, handleValuesChange } = useChangedFields(form, [claim]);
  const preTrialWatch = Form.useWatch("pre_trial_claim", form);
  const unitIdsWatch = Form.useWatch("unit_ids", form) ?? [];
  const { data: selectedUnits = [] } = useUnitsByIds(
    Array.isArray(unitIdsWatch) ? unitIdsWatch : [],
  );
  const { data: lockedUnitIds = [] } = useLockedUnitIds();
  const prevUnitIds = React.useRef<number[]>([]);
  const didMountUnits = React.useRef(false);

  React.useEffect(() => {
    if (!didMountUnits.current) {
      prevUnitIds.current = Array.isArray(unitIdsWatch) ? unitIdsWatch : [];
      didMountUnits.current = true;
      return;
    }
    const added = (Array.isArray(unitIdsWatch) ? unitIdsWatch : []).filter(
      (id) => !prevUnitIds.current.includes(id),
    );
    if (added.some((id) => lockedUnitIds.includes(id))) {
      Modal.warning({
        title: 'Объект заблокирован',
        content: 'Работы по устранению замечаний запрещено выполнять.',
      });
    }
    prevUnitIds.current = Array.isArray(unitIdsWatch) ? unitIdsWatch : [];
  }, [unitIdsWatch, lockedUnitIds]);
  const buildingsText = React.useMemo(
    () =>
      Array.from(
        new Set(selectedUnits.map((u) => u.building).filter(Boolean)),
      ).join(", "),
    [selectedUnits],
  );

  // Доступные корпуса из всех объектов проекта
  const availableBuildings = React.useMemo(
    () =>
      Array.from(new Set(units.map((u) => u.building).filter(Boolean))).sort(),
    [units],
  );

  // Следим за выбранным корпусом
  const buildingWatch = Form.useWatch("building", form);
  
  // Фильтруем объекты по выбранному корпусу
  const filteredUnits = React.useMemo(() => {
    if (!buildingWatch) return units;
    return units.filter((u) => u.building === buildingWatch);
  }, [units, buildingWatch]);

  useImperativeHandle(ref, () => ({
    submit: () => form.submit(),
    isSubmitting: update.isPending,
  }));

  const highlight = (name: keyof ClaimFormAntdEditValues) =>
    changedFields[name as string]
      ? { background: "#fffbe6", padding: 4, borderRadius: 2 }
      : {};

  useEffect(() => {
    if (!claim) return;
    
    // Сбрасываем ref'ы при новой претензии
    isInitialLoadRef.current = true;
    prevBuildingRef.current = null;
    
    form.setFieldsValue({
      project_id: claim.project_id,
      unit_ids: claim.unit_ids,
      claim_status_id: claim.claim_status_id,
      claim_no: claim.claim_no,
      claimed_on: claim.claimedOn ?? null,
      accepted_on: claim.acceptedOn ?? null,
      registered_on: claim.registeredOn ?? null,
      engineer_id: claim.engineer_id ?? null,
      owner: claim.owner ?? null,
      case_uid_id: claim.case_uid_id ?? null,
      pre_trial_claim: claim.pre_trial_claim ?? false,
      description: claim.description ?? "",
    });
  }, [claim, form]);

  // Отдельный useEffect для установки building после загрузки selectedUnits
  useEffect(() => {
    if (!claim || !selectedUnits.length || !claim.unit_ids?.length) return;
    
    console.log('Setting building for claim:', claim.id, 'selectedUnits:', selectedUnits.length, 'unit_ids:', claim.unit_ids);
    console.log('Selected units:', selectedUnits.map(u => ({id: u.id, building: u.building})));
    
    const claimBuildings = Array.from(
      new Set(selectedUnits.map(u => u.building).filter(Boolean))
    );
    console.log('Claim buildings:', claimBuildings);
    
    if (claimBuildings.length >= 1) {
      const building = claimBuildings[0];
      console.log('Setting building to:', building);
      form.setFieldValue("building", building);
      
      // Также устанавливаем ref для предотвращения сброса
      prevBuildingRef.current = building;
    }
  }, [claim, selectedUnits, form]);

  // Очищаем объекты при смене корпуса
  const prevBuildingRef = React.useRef<string | null>(null);
  const isInitialLoadRef = React.useRef(true);
  
  useEffect(() => {
    // Пропускаем первоначальную загрузку
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevBuildingRef.current = buildingWatch;
      return;
    }
    
    // Только если корпус действительно изменился пользователем
    if (prevBuildingRef.current !== null && prevBuildingRef.current !== buildingWatch) {
      const currentUnitIds = form.getFieldValue("unit_ids") || [];
      
      if (buildingWatch) {
        // Фильтруем объекты по новому корпусу
        const validUnitIds = currentUnitIds.filter((id: number) => {
          const unit = units.find(u => u.id === id);
          return unit && unit.building === buildingWatch;
        });
        
        if (validUnitIds.length !== currentUnitIds.length) {
          form.setFieldValue("unit_ids", validUnitIds);
        }
      }
    }
    prevBuildingRef.current = buildingWatch;
  }, [buildingWatch, form, units]);

  const onFinish = async (values: ClaimFormAntdEditValues) => {
    if (!claim) return;
    if (values.unit_ids?.some((id) => lockedUnitIds.includes(id))) {
      Modal.warning({
        title: "Объект заблокирован",
        content: "Работы по устранению замечаний запрещено выполнять.",
      });
      return;
    }
    try {
      await update.mutateAsync({
        id: claim.id,
        updates: {
          project_id: values.project_id ?? claim.project_id,
          unit_ids: values.unit_ids,
          claim_status_id: values.claim_status_id,
          claim_no: values.claim_no,
          claimed_on: values.claimed_on
            ? values.claimed_on.format("YYYY-MM-DD")
            : null,
          accepted_on: values.accepted_on
            ? values.accepted_on.format("YYYY-MM-DD")
            : null,
          registered_on: values.registered_on
            ? values.registered_on.format("YYYY-MM-DD")
            : null,
          engineer_id: values.engineer_id ?? null,
          owner: values.owner ?? null,
          case_uid_id: values.case_uid_id ?? null,
          pre_trial_claim: values.pre_trial_claim ?? false,
          description: values.description ?? "",
          updated_by: userId ?? undefined,
        } as any,
      });

      if (!claim.pre_trial_claim && values.pre_trial_claim) {
        await markClaimDefectsPreTrial(claim.id);
      }

      if (attachments.removedIds.length) {
        await removeClaimAttachmentsBulk(
          claim.id,
          attachments.removedIds.map(Number),
        );
      }
      let uploaded: RemoteClaimFile[] = [];
      if (attachments.newFiles.length) {
        const res = await addAtt.mutateAsync({
          claimId: claim.id,
          files: attachments.newFiles.map((f) => f.file),
        });
        uploaded = res.map((u) => ({
          id: u.id,
          name: u.original_name ?? u.storage_path.split("/").pop() ?? "file",
          original_name: u.original_name ?? null,
          path: u.storage_path,
          url: u.file_url,
          mime_type: u.file_type,
        }));
        attachments.appendRemote(uploaded);
      }
      if (Object.keys(attachments.changedDesc).length) {
        await Promise.all(
          Object.entries(attachments.changedDesc).map(([id, val]) =>
            updateAttachmentDescription(Number(id), val),
          ),
        );
      }
      attachments.markPersisted();
      notify.success("Претензия обновлена");
      onSaved?.();
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  if (!claim) return <Skeleton active />;

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={handleValuesChange}
        style={{ maxWidth: embedded ? "none" : 640 }}
        autoComplete="off"
      >
        <Row gutter={16}>
          <Col span={8} hidden={!allowPretrial}>
            <Form.Item
              name="pre_trial_claim"
              label="Досудебная претензия"
              valuePropName="checked"
              style={highlight("pre_trial_claim")}
            >
              <Switch disabled={!allowPretrial} />
            </Form.Item>
          </Col>
          <Col span={8} hidden={!allowPretrial}>
            <Form.Item
              name="case_uid_id"
              label="Уникальный идентификатор дела"
              hidden={!preTrialWatch}
              style={highlight("case_uid_id")}
            >
              <Select
                showSearch
                allowClear
                disabled={!preTrialWatch || !allowPretrial}
                options={caseUids.map((c) => ({ value: c.id, label: c.uid }))}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="project_id"
              label="Проект"
              rules={[{ required: true }]}
              style={highlight("project_id")}
            >
              <Select
                allowClear
                options={projects.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              name="building" 
              label="Корпус"
              style={highlight("building")}
            >
              <Select
                allowClear
                placeholder="Выберите корпус"
                options={availableBuildings.map((b) => ({ value: b, label: b }))}
                disabled={!projectId}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="unit_ids"
              label="Объекты"
              rules={[{ required: true }]}
              style={highlight("unit_ids")}
            >
              {embedded ? (
                <div style={{ 
                  padding: '4px 11px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  minHeight: '32px',
                  lineHeight: '24px'
                }}>
                  {selectedUnits.length > 0 
                    ? selectedUnits.map(u => u.name).join(', ')
                    : <span style={{ color: '#bfbfbf' }}>Не указаны</span>
                  }
                </div>
              ) : (
                <Select
                  mode="multiple"
                  options={filteredUnits.map((u) => ({ value: u.id, label: u.name }))}
                  disabled={!projectId}
                  placeholder={buildingWatch ? `Объекты в корпусе ${buildingWatch}` : "Сначала выберите корпус"}
                />
              )}
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Собственник объекта"
              name="owner"
              style={highlight("owner")}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="engineer_id"
              label="Закрепленный инженер"
              rules={[{ required: true }]}
              style={highlight("engineer_id")}
            >
              <Select
                allowClear
                showSearch
                options={users.map((u) => ({ value: u.id, label: u.name }))}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="claim_no"
              label="№ претензии"
              rules={[{ required: true }]}
              style={highlight("claim_no")}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="claimed_on"
              label="Дата претензии"
              style={highlight("claimed_on")}
            >
              <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="accepted_on"
              label="Дата получения претензии Застройщиком"
              style={highlight("accepted_on")}
            >
              <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="registered_on"
              label="Дата регистрации претензии GARANTHUB"
              style={highlight("registered_on")}
            >
              <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="claim_status_id"
              label="Статус"
              rules={[{ required: true }]}
              style={highlight("claim_status_id")}
            >
              <Select
                showSearch
                options={statuses.map((s) => ({ value: s.id, label: s.name }))}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="description"
              label="Дополнительная информация"
              style={highlight("description")}
            >
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
        </Row>
        {showAttachments && (
          <Form.Item
            label="Файлы"
            style={
              attachments.attachmentsChanged
                ? { background: "#fffbe6", padding: 4, borderRadius: 2 }
                : {}
            }
          >
            <FileDropZone onFiles={attachments.addFiles} />
            <AttachmentEditorTable
              remoteFiles={attachments.remoteFiles.map((f) => ({
                id: String(f.id),
                name: f.name,
                path: f.path,
                mime: f.mime_type,
                description: f.description ?? "",
              }))}
              newFiles={attachments.newFiles.map((f) => ({
                file: f.file,
                mime: f.file.type,
                description: f.description,
              }))}
              showDetails
              onDescNew={(idx, d) => attachments.setDescription(idx, d)}
              onRemoveRemote={(id) => attachments.removeRemote(id)}
              onRemoveNew={(idx) => attachments.removeNew(idx)}
              getSignedUrl={(path, name) => signedUrl(path, name)}
            />
          </Form.Item>
        )}
        {!hideActions && (
          <Form.Item style={{ textAlign: "right" }}>
            {onCancel && (
              <Button
                style={{ marginRight: 8 }}
                onClick={onCancel}
                disabled={update.isPending}
              >
                Отмена
              </Button>
            )}
            <Button type="primary" htmlType="submit" loading={update.isPending}>
              Сохранить
            </Button>
          </Form.Item>
        )}
      </Form>
    </>
  );
});

export default ClaimFormAntdEdit;
