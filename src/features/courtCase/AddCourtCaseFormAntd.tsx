import React, { useState, useEffect, useRef } from "react";
import {
  Form,
  Row,
  Col,
  Input,
  DatePicker,
  Select,
  Button,
  Space,
  AutoComplete,
} from "antd";
import { Dayjs } from "dayjs";
import { useVisibleProjects } from "@/entities/project";
import { useUnitsByProject } from "@/entities/unit";
import useProjectBuildings from "@/shared/hooks/useProjectBuildings";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useUsers } from "@/entities/user";
import { useCourtCaseStatuses } from "@/entities/courtCaseStatus";
import {
  useAddCourtCase,
  useUpdateCourtCase,
  isCaseNumberUnique,
} from "@/entities/courtCase";
import { addCaseAttachments } from "@/entities/attachment";
import { useAddCaseClaims } from "@/entities/courtCaseClaim";
import { useCaseUids, getOrCreateCaseUid } from "@/entities/courtCaseUid";
import CourtCaseClaimsTable from "@/widgets/CourtCaseClaimsTable";
import CourtCasePartiesTable from "@/widgets/CourtCasePartiesTable";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectId } from "@/shared/hooks/useProjectId";
import { useAuthStore } from "@/shared/store/authStore";
import FileDropZone from "@/shared/ui/FileDropZone";
import { useNotify } from "@/shared/hooks/useNotify";
import { useCaseFiles } from "./model/useCaseFiles";
import { useAddCaseParties } from "@/entities/courtCaseParty";
import type { CasePartyRole } from "@/shared/types/courtCaseParty";
import { useAddCaseClaimLinks } from "@/entities/courtCaseClaimLink";
import RelatedClaimsList from "./RelatedClaimsList";

/**
 * Props for {@link AddCourtCaseFormAntd} component.
 */
export interface AddCourtCaseFormAntdProps {
  /** Callback when case created successfully */
  onCreated?: () => void;
  /** Initial field values */
  initialValues?: Partial<{
    project_id: number;
    unit_ids: number[];
    responsible_lawyer_id: string;
    status: number;
    case_uid: string;
  }>;
}

/** Форма добавления судебного дела на Ant Design */
export default function AddCourtCaseFormAntd({
  onCreated,
  initialValues = {},
}: AddCourtCaseFormAntdProps) {
  const [form] = Form.useForm();
  const projectIdStr = Form.useWatch("project_id", form);
  const globalProjectId = useProjectId();
  const projectId = projectIdStr != null ? Number(projectIdStr) : null;
  const buildingWatch = Form.useWatch("building", form) ?? null;
  const buildingDebounced = useDebounce(buildingWatch);
  const unitIdsWatch: number[] = Form.useWatch("unit_ids", form) || [];
  const relatedIdsWatch: number[] =
    Form.useWatch("related_claim_ids", form) || [];
  const profileId = useAuthStore((s) => s.profile?.id);
  const prevProjectIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialValues.project_id) {
      form.setFieldValue("project_id", initialValues.project_id);
      prevProjectIdRef.current = initialValues.project_id;
    } else if (globalProjectId) {
      form.setFieldValue("project_id", Number(globalProjectId));
      prevProjectIdRef.current = Number(globalProjectId);
    }
    if (initialValues.unit_ids) {
      form.setFieldValue("unit_ids", initialValues.unit_ids);
    }
    if (initialValues.responsible_lawyer_id) {
      form.setFieldValue(
        "responsible_lawyer_id",
        initialValues.responsible_lawyer_id,
      );
    } else if (profileId) {
      form.setFieldValue("responsible_lawyer_id", profileId);
    }
    if (initialValues.status) {
      form.setFieldValue("status", initialValues.status);
    }
    if (initialValues.case_uid) {
      form.setFieldValue("case_uid", initialValues.case_uid);
    }
  }, [initialValues, globalProjectId, profileId, form]);

  /**
   * Reset selected units when project changes to avoid inconsistent data
   * as units are linked to a specific project.
   */
  useEffect(() => {
    const prev = prevProjectIdRef.current;
    if (prev != null && projectId != null && prev !== projectId) {
      form.setFieldsValue({ unit_ids: [], building: undefined });
    }
    prevProjectIdRef.current = projectId ?? null;
  }, [projectId]);

  const { data: projects = [] } = useVisibleProjects();
  const { buildings = [] } = useProjectBuildings(projectId);
  const { data: units = [], isPending: unitsLoading } = useUnitsByProject(
    projectId,
    buildingDebounced ?? undefined,
  );
  const { data: users = [], isPending: usersLoading } = useUsers();
  const { data: stages = [], isPending: stagesLoading } =
    useCourtCaseStatuses();
  const { data: caseUids = [] } = useCaseUids();
  const addCaseMutation = useAddCourtCase();
  const updateCaseMutation = useUpdateCourtCase();
  const addClaimsMutation = useAddCaseClaims();
  const addPartiesMutation = useAddCaseParties();
  const addClaimLinksMutation = useAddCaseClaimLinks();
  const notify = useNotify();
  const qc = useQueryClient();

  // Set default litigation stage when loaded
  useEffect(() => {
    if (stages.length && !form.getFieldValue("status")) {
      form.setFieldValue("status", stages[0].id);
    }
  }, [stages, form]);

  const {
    caseFiles,
    addFiles: addCaseFiles,
    setDescription: setCaseFileDescription,
    removeFile,
    reset: resetCaseFiles,
  } = useCaseFiles();

  const handleCaseFiles = (files: File[]) => addCaseFiles(files);

  const handleAddCase = async (values: any) => {
    try {
      const parties: any[] = values.parties || [];
      const hasPlaintiff = parties.some((p) => p.role === "plaintiff");
      const hasDefendant = parties.some((p) => p.role === "defendant");
      if (!hasPlaintiff || !hasDefendant) {
        notify.error("Добавьте как минимум одного истца и одного ответчика");
        return;
      }
      const uidId = await getOrCreateCaseUid(values.case_uid);

      const newCase = await addCaseMutation.mutateAsync({
        project_id: values.project_id,
        unit_ids: values.unit_ids || [],
        number: values.number,
        date: values.date.format("YYYY-MM-DD"),
        case_uid_id: uidId,
        responsible_lawyer_id: values.responsible_lawyer_id,
        status: values.status,
        fix_start_date: values.fix_start_date
          ? (values.fix_start_date as Dayjs).format("YYYY-MM-DD")
          : null,
        fix_end_date: values.fix_end_date
          ? (values.fix_end_date as Dayjs).format("YYYY-MM-DD")
          : null,
        description: values.description || "",
        created_by: profileId,
      } as any);

      let newAtts: { id: number }[] = [];
      if (caseFiles.length) {
        newAtts = await addCaseAttachments(
          caseFiles.map((f) => ({
            file: f.file,
            type_id: f.type_id,
            description: f.description,
          })),
          newCase.id,
        );
        await updateCaseMutation.mutateAsync({
          id: newCase.id,
          updates: { attachment_ids: newAtts.map((a) => a.id) },
        });
        qc.invalidateQueries({ queryKey: ["court_cases"] });
      }

      if (parties.length) {
        await addPartiesMutation.mutateAsync(
          parties.map((p: any) => ({
            case_id: newCase.id,
            project_id: values.project_id,
            role: p.role as CasePartyRole,
            person_id: p.type === "person" ? p.entityId : null,
            contractor_id: p.type === "contractor" ? p.entityId : null,
          })),
        );
      }

      const claims: any[] = (values.claims || []).filter((c: any) =>
        [
          "claimed_amount",
          "confirmed_amount",
          "paid_amount",
          "agreed_amount",
        ].some((k) => c[k] != null && c[k] !== ""),
      );
      if (claims.length) {
        await addClaimsMutation.mutateAsync(
          claims.map((c: any) => ({
            case_id: newCase.id,
            claim_type_id: c.claim_type_id,
            claimed_amount: c.claimed_amount ? Number(c.claimed_amount) : null,
            confirmed_amount: c.confirmed_amount
              ? Number(c.confirmed_amount)
              : null,
            paid_amount: c.paid_amount ? Number(c.paid_amount) : null,
            agreed_amount: c.agreed_amount ? Number(c.agreed_amount) : null,
          })),
        );
      }

      const linked: number[] = values.related_claim_ids || [];
      if (linked.length) {
        await addClaimLinksMutation.mutateAsync(
          linked.map((id: number) => ({ case_id: newCase.id, claim_id: id })),
        );
      }

      form.resetFields();
      resetCaseFiles();
      notify.success("Дело успешно добавлено!");
      onCreated?.();
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleAddCase}
        autoComplete="off"
      >
        {/* Row 1: Project, Building, Objects */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="project_id"
              label="Проект"
              rules={[{ required: true, message: "Выберите проект" }]}
            >
              <Select
                options={projects.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="building" label="Корпус">
              <Select
                allowClear
                options={buildings.map((b) => ({ value: b, label: b }))}
                disabled={!projectId}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="unit_ids"
              label="Объекты"
              rules={[{ required: true, message: "Выберите объекты" }]}
            >
              <Select
                mode="multiple"
                loading={unitsLoading}
                options={units.map((u) => ({ value: u.id, label: u.name }))}
                disabled={!projectId}
              />
            </Form.Item>
          </Col>
        </Row>
        {/* Row 2: Lawyer and UID */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="responsible_lawyer_id"
              label="Ответственный юрист"
              rules={[{ required: true, message: "Выберите юриста" }]}
            >
              <Select
                loading={usersLoading}
                options={users.map((u) => ({ value: u.id, label: u.name }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="case_uid"
              label="Уникальный идентификатор"
              validateTrigger="onBlur"
              rules={[{ required: true, message: "Укажите UID" }]}
            >
              <AutoComplete
                allowClear
                placeholder="UID"
                options={caseUids.map((u) => ({ value: u.uid }))}
                filterOption={(input, option) =>
                  String(option?.value ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
        </Row>
        {/* Row 3 */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="number"
              label="Номер дела"
              validateTrigger="onBlur"
              rules={[
                { required: true, message: "Укажите номер" },
                {
                  validator: async (_, value) => {
                    if (!value) return Promise.resolve();
                    const unique = await isCaseNumberUnique(value);
                    if (!unique) {
                      notify.error("Номер дела уже используется");
                      return Promise.reject(new Error("Номер не уникален"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="date"
              label="Дата"
              rules={[{ required: true, message: "Укажите дату" }]}
            >
              <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="status"
              label="Статус"
              rules={[{ required: true, message: "Выберите статус" }]}
            >
              <Select
                loading={stagesLoading}
                options={stages.map((s) => ({ value: s.id, label: s.name }))}
              />
            </Form.Item>
          </Col>
        </Row>
        {/* Row 4 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="fix_start_date" label="Дата начала устранения">
              <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="fix_end_date"
              label="Дата завершения устранения"
              dependencies={["fix_start_date"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const start = getFieldValue("fix_start_date");
                    if (!value || !start || value.isSameOrAfter(start, "day")) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Дата завершения меньше даты начала"),
                    );
                  },
                }),
              ]}
            >
              <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        {/* Row 5 */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="description" label="Описание">
              <Input.TextArea rows={1} />
            </Form.Item>
          </Col>
        </Row>
        <Form.List name="parties">
          {(fields, { add, remove }) => (
            <CourtCasePartiesTable fields={fields} add={add} remove={remove} />
          )}
        </Form.List>
        {/* Row 6: Требования */}
        <Form.List name="claims">
          {(fields, { add, remove, move }) => (
            <CourtCaseClaimsTable
              fields={fields}
              add={add}
              remove={remove}
              move={move}
            />
          )}
        </Form.List>
        <Form.Item label="Связанные претензии">
          <div style={{ maxWidth: 1040 }}>
            <RelatedClaimsList
              projectId={projectId}
              unitIds={unitIdsWatch}
              value={relatedIdsWatch}
              onChange={(ids) => form.setFieldValue("related_claim_ids", ids)}
            />
          </div>
        </Form.Item>
        {/* Row 7 */}
        <Row gutter={16}>
          <Col span={24}>
            <FileDropZone onFiles={handleCaseFiles} />
            {caseFiles.map((f, i) => (
              <Row key={i} gutter={8} align="middle" style={{ marginTop: 4 }}>
                <Col flex="auto">
                  <span>{f.file.name}</span>
                </Col>
                <Col flex="220px">
                  <Input
                    placeholder="Описание"
                    size="small"
                    value={f.description}
                    onChange={(e) => setCaseFileDescription(i, e.target.value)}
                  />
                </Col>
                <Col>
                  <Button type="text" danger onClick={() => removeCaseFile(i)}>
                    Удалить
                  </Button>
                </Col>
              </Row>
            ))}
          </Col>
        </Row>
        <Form.Item style={{ textAlign: "right" }}>
          <Button type="primary" htmlType="submit">
            Добавить дело
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}
