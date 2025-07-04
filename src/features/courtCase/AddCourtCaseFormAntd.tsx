import React, { useState, useEffect, useRef } from 'react';
import {
  Form,
  Row,
  Col,
  Input,
  DatePicker,
  Select,
  Button,
  Space,
  Radio,
  Popconfirm,
  Modal,
  Tag,
} from 'antd';
import { Dayjs } from 'dayjs';
import { useVisibleProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import useProjectBuildings from '@/shared/hooks/useProjectBuildings';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  useContractors,
  useDeleteContractor,
} from '@/entities/contractor';
import { useUsers } from '@/entities/user';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';
import { usePersons, useDeletePerson } from '@/entities/person';
import { useAddCourtCase, useUpdateCourtCase } from '@/entities/courtCase';
import { addCaseAttachments } from '@/entities/attachment';
import { useAddCaseClaims } from '@/entities/courtCaseClaim';
import { useCaseUids, getOrCreateCaseUid } from '@/entities/caseUid';
import CourtCaseClaimsTable from '@/widgets/CourtCaseClaimsTable';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import FileDropZone from '@/shared/ui/FileDropZone';
import { useNotify } from '@/shared/hooks/useNotify';
import PersonModalId from '@/features/person/PersonModalId';
import ContractorModalId from '@/features/contractor/ContractorModalId';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCaseFiles } from './model/useCaseFiles';

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
  const projectIdStr = Form.useWatch('project_id', form);
  const globalProjectId = useProjectId();
  const projectId = projectIdStr != null ? Number(projectIdStr) : null;
  const buildingWatch = Form.useWatch('building', form) ?? null;
  const buildingDebounced = useDebounce(buildingWatch);
  const profileId = useAuthStore((s) => s.profile?.id);
  const prevProjectIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (initialValues.project_id) {
      form.setFieldValue('project_id', initialValues.project_id);
      prevProjectIdRef.current = initialValues.project_id;
    } else if (globalProjectId) {
      form.setFieldValue('project_id', Number(globalProjectId));
      prevProjectIdRef.current = Number(globalProjectId);
    }
    if (initialValues.unit_ids) {
      form.setFieldValue('unit_ids', initialValues.unit_ids);
    }
    if (initialValues.responsible_lawyer_id) {
      form.setFieldValue('responsible_lawyer_id', initialValues.responsible_lawyer_id);
    } else if (profileId) {
      form.setFieldValue('responsible_lawyer_id', profileId);
    }
    if (initialValues.status) {
      form.setFieldValue('status', initialValues.status);
    }
    if (initialValues.case_uid) {
      form.setFieldValue('case_uid', initialValues.case_uid);
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
  const { data: contractors = [], isPending: contractorsLoading } = useContractors();
  const { data: users = [], isPending: usersLoading } = useUsers();
  const { data: stages = [], isPending: stagesLoading } = useCourtCaseStatuses();
  const { data: personsList = [] } = usePersons();
  const { data: caseUids = [] } = useCaseUids();
  const addCaseMutation = useAddCourtCase();
  const updateCaseMutation = useUpdateCourtCase();
  const addClaimsMutation = useAddCaseClaims();
  const deletePersonMutation = useDeletePerson();
  const deleteContractorMutation = useDeleteContractor();
  const notify = useNotify();
  const qc = useQueryClient();

  // Set default litigation stage when loaded
  useEffect(() => {
    if (stages.length && !form.getFieldValue('status')) {
      form.setFieldValue('status', stages[0].id);
    }
  }, [stages, form]);

  const [personModal, setPersonModal] = useState<any | null>(null);
  const [contractorModal, setContractorModal] = useState<any | null>(null);
  const [partyRole, setPartyRole] = useState<'plaintiff' | 'defendant' | null>(null);
  const [showClaims, setShowClaims] = useState(false);
  const { caseFiles, addFiles: addCaseFiles, setType: setCaseFileType, setDescription: setCaseFileDescription, removeFile: removeCaseFile, reset: resetCaseFiles } = useCaseFiles();

  useEffect(() => {
    if (showClaims && !(form.getFieldValue('claims')?.length)) {
      form.setFieldValue('claims', [{}]);
    }
  }, [showClaims, form]);

  const { data: projectPersons = [], isPending: personsLoading } = useQuery({
    queryKey: ['projectPersons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('persons')
        .select('id, full_name')
        .order('full_name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleCaseFiles = (files: File[]) => addCaseFiles(files);

  /**
   * Remove selected person id from form and delete record.
   */
  const removePerson = async (
    field: 'plaintiff_person_ids' | 'defendant_person_ids',
    id: number,
  ) => {
    try {
      await deletePersonMutation.mutateAsync(id);
      const list: number[] = form.getFieldValue(field) || [];
      form.setFieldValue(
        field,
        list.filter((pid) => pid !== id),
      );
      notify.success('Физлицо удалено');
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  /**
   * Remove selected contractor id from form and delete record.
   */
  const removeContractor = async (
    field: 'plaintiff_contractor_ids' | 'defendant_contractor_ids',
    id: number,
  ) => {
    try {
      await deleteContractorMutation.mutateAsync(id);
      const list: number[] = form.getFieldValue(field) || [];
      form.setFieldValue(
        field,
        list.filter((cid) => cid !== id),
      );
      notify.success('Контрагент удален');
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  /**
   * Tag renderer with edit/remove actions for persons.
   */
  const personTagRender = (
    field: 'plaintiff_person_ids' | 'defendant_person_ids',
    role: 'plaintiff' | 'defendant',
  ) =>
    (tagProps: any) => {
      const { value, closable, onClose } = tagProps;
      const person = personsList.find((p) => p.id === Number(value));
      return (
        <Tag
          closable={closable}
          onClose={onClose}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <span>{person?.full_name || value}</span>
          <EditOutlined
            style={{ marginLeft: 4 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPartyRole(role);
              setPersonModal(
                personsList.find((p) => p.id === Number(value)) || null,
              );
            }}
          />
          <Popconfirm
            title="Удалить?"
            okText="Да"
            cancelText="Нет"
            onConfirm={() => removePerson(field, Number(value))}
          >
            <DeleteOutlined
              style={{ marginLeft: 4, color: '#ff4d4f' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          </Popconfirm>
        </Tag>
      );
    };

  /**
   * Tag renderer with edit/remove actions for contractors.
   */
  const contractorTagRender = (
    field: 'plaintiff_contractor_ids' | 'defendant_contractor_ids',
    role: 'plaintiff' | 'defendant',
  ) =>
    (tagProps: any) => {
      const { value, closable, onClose } = tagProps;
      const contractor = contractors.find((c) => c.id === Number(value));
      return (
        <Tag
          closable={closable}
          onClose={onClose}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <span>{contractor?.name || value}</span>
          <EditOutlined
            style={{ marginLeft: 4 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPartyRole(role);
              setContractorModal(
                contractors.find((c) => c.id === Number(value)) || null,
              );
            }}
          />
          <Popconfirm
            title="Удалить?"
            okText="Да"
            cancelText="Нет"
            onConfirm={() => removeContractor(field, Number(value))}
          >
            <DeleteOutlined
              style={{ marginLeft: 4, color: '#ff4d4f' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          </Popconfirm>
        </Tag>
      );
    };

  const handleAddCase = async (values: any) => {
    try {
      const uidId = await getOrCreateCaseUid(values.case_uid);
    const newCase = await addCaseMutation.mutateAsync({
      project_id: values.project_id,
      unit_ids: values.unit_ids || [],
      number: values.number,
      date: values.date.format('YYYY-MM-DD'),
      case_uid_id: uidId,
      plaintiff_person_ids: (values.plaintiff_person_ids || []).map(Number),
      plaintiff_contractor_ids: (values.plaintiff_contractor_ids || []).map(Number),
      defendant_person_ids: (values.defendant_person_ids || []).map(Number),
      defendant_contractor_ids: (values.defendant_contractor_ids || []).map(Number),
      responsible_lawyer_id: values.responsible_lawyer_id,
      status: values.status,
      fix_start_date: values.fix_start_date
        ? (values.fix_start_date as Dayjs).format('YYYY-MM-DD')
        : null,
      fix_end_date: values.fix_end_date
        ? (values.fix_end_date as Dayjs).format('YYYY-MM-DD')
        : null,
      description: values.description || '',
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
      qc.invalidateQueries({ queryKey: ['court_cases'] });
    }

    const parties: any[] = [];
    (values.plaintiff_person_ids || []).forEach((pid: number) =>
      parties.push({
        role: 'plaintiff',
        person_id: pid,
        contractor_id: null,
        project_id: values.project_id,
      }),
    );
    (values.plaintiff_contractor_ids || []).forEach((cid: number) =>
      parties.push({
        role: 'plaintiff',
        contractor_id: cid,
        person_id: null,
        project_id: values.project_id,
      }),
    );
    (values.defendant_person_ids || []).forEach((pid: number) =>
      parties.push({
        role: 'defendant',
        person_id: pid,
        contractor_id: null,
        project_id: values.project_id,
      }),
    );
    (values.defendant_contractor_ids || []).forEach((cid: number) =>
      parties.push({
        role: 'defendant',
        contractor_id: cid,
        person_id: null,
        project_id: values.project_id,
      }),
    );
    if (parties.length) {
      await updateCaseMutation.mutateAsync({
        id: newCase.id,
        updates: {
          parties,
        },
      });
      qc.invalidateQueries({ queryKey: ['court_cases'] });
    }

      const claims: any[] = (values.claims || []).filter((c: any) =>
        ['claimed_amount', 'confirmed_amount', 'paid_amount', 'agreed_amount'].some((k) => c[k] != null && c[k] !== '')
      );
      if (claims.length) {
        await addClaimsMutation.mutateAsync(
          claims.map((c: any) => ({
            case_id: newCase.id,
            claim_type_id: c.claim_type_id,
            claimed_amount: c.claimed_amount ? Number(c.claimed_amount) : null,
            confirmed_amount: c.confirmed_amount ? Number(c.confirmed_amount) : null,
            paid_amount: c.paid_amount ? Number(c.paid_amount) : null,
            agreed_amount: c.agreed_amount ? Number(c.agreed_amount) : null,
          }))
        );
      }

      form.resetFields();
      resetCaseFiles();
      notify.success('Дело успешно добавлено!');
      onCreated?.();
    } catch (e: any) {
      notify.error(e.message);
    }
  };


  return (
    <>
      <Form form={form} layout="vertical" onFinish={handleAddCase} autoComplete="off">
        {/* Row 1: Project, Building, Objects */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="project_id" label="Проект" rules={[{ required: true, message: 'Выберите проект' }]}>
              <Select options={projects.map((p) => ({ value: p.id, label: p.name }))} />
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
            <Form.Item name="unit_ids" label="Объекты" rules={[{ required: true, message: 'Выберите объекты' }]}>
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
            <Form.Item name="responsible_lawyer_id" label="Ответственный юрист" rules={[{ required: true, message: 'Выберите юриста' }]}>
              <Select loading={usersLoading} options={users.map((u) => ({ value: u.id, label: u.name }))} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="case_uid"
              label="Уникальный идентификатор"
              rules={[{ required: true, message: 'Укажите UID' }]}
            >
              <Select
                mode="tags"
                open={false}
                tokenSeparators={[',']}
                placeholder="UID"
                options={caseUids.map((u) => ({ value: u.uid, label: u.uid }))}
              />
            </Form.Item>
          </Col>
        </Row>
        {/* Row 3 */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="number" label="Номер дела" rules={[{ required: true, message: 'Укажите номер' }]}> 
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="date" label="Дата" rules={[{ required: true, message: 'Укажите дату' }]}> 
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="status" label="Статус" rules={[{ required: true, message: 'Выберите статус' }]}> 
              <Select loading={stagesLoading} options={stages.map((s) => ({ value: s.id, label: s.name }))} />
            </Form.Item>
          </Col>
        </Row>
        {/* Row 5 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="plaintiff_person_ids" label="Истцы (физлица)">
              <Space.Compact style={{ width: '100%' }}>
                <Select
                  mode="multiple"
                  showSearch
                  optionFilterProp="label"
                  tagRender={personTagRender('plaintiff_person_ids', 'plaintiff')}
                  loading={personsLoading}
                  options={projectPersons.map((p) => ({ value: p.id, label: p.full_name }))}
                  disabled={!projectId}
                  style={{ width: '100%' }}
                />
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setPartyRole('plaintiff');
                    setPersonModal({});
                  }}
                />
              </Space.Compact>
            </Form.Item>
            <Form.Item name="plaintiff_contractor_ids" label="Истцы (контрагенты)">
              <Space.Compact style={{ width: '100%' }}>
                <Select
                  mode="multiple"
                  showSearch
                  optionFilterProp="label"
                  tagRender={contractorTagRender('plaintiff_contractor_ids', 'plaintiff')}
                  loading={contractorsLoading}
                  options={contractors.map((c) => ({ value: c.id, label: c.name }))}
                  style={{ width: '100%' }}
                />
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setPartyRole('plaintiff');
                    setContractorModal({});
                  }}
                />
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="defendant_person_ids" label="Ответчики (физлица)">
              <Space.Compact style={{ width: '100%' }}>
                <Select
                  mode="multiple"
                  showSearch
                  optionFilterProp="label"
                  tagRender={personTagRender('defendant_person_ids', 'defendant')}
                  loading={personsLoading}
                  options={projectPersons.map((p) => ({ value: p.id, label: p.full_name }))}
                  style={{ width: '100%' }}
                />
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setPartyRole('defendant');
                    setPersonModal({});
                  }}
                />
              </Space.Compact>
            </Form.Item>
            <Form.Item name="defendant_contractor_ids" label="Ответчики (контрагенты)">
              <Space.Compact style={{ width: '100%' }}>
                <Select
                  mode="multiple"
                  showSearch
                  optionFilterProp="label"
                  tagRender={contractorTagRender('defendant_contractor_ids', 'defendant')}
                  loading={contractorsLoading}
                  options={contractors.map((c) => ({ value: c.id, label: c.name }))}
                  style={{ width: '100%' }}
                />
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setPartyRole('defendant');
                    setContractorModal({});
                  }}
                />
              </Space.Compact>
            </Form.Item>
          </Col>
        </Row>
        {/* Row 4 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="fix_start_date" label="Дата начала устранения">
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="fix_end_date"
              label="Дата завершения устранения"
              dependencies={['fix_start_date']}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const start = getFieldValue('fix_start_date');
                    if (!value || !start || value.isSameOrAfter(start, 'day')) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Дата завершения меньше даты начала'));
                  },
                }),
              ]}
            >
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
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
        {/* Row 6: Требования */}
        {!showClaims ? (
          <Row gutter={16}>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Button type="dashed" onClick={() => setShowClaims(true)}>
                Добавить требования
              </Button>
            </Col>
          </Row>
        ) : (
          <Form.List name="claims">
            {(fields, { add, remove }) => (
              <CourtCaseClaimsTable fields={fields} add={add} remove={remove} />
            )}
          </Form.List>
        )}
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
        <Form.Item style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit">
            Добавить дело
          </Button>
        </Form.Item>
      </Form>

      <PersonModalId
        open={!!personModal}
        onClose={() => {
          setPersonModal(null);
          setPartyRole(null);
        }}
        onSelect={(id) => {
          const field =
            partyRole === 'defendant' ? 'defendant_person_ids' : 'plaintiff_person_ids';
          const current: number[] = form.getFieldValue(field) || [];
          if (id == null) {
            form.setFieldValue(
              field,
              current.filter((v) => v !== personModal?.id),
            );
          } else {
            form.setFieldValue(field, Array.from(new Set([...current, id])));
          }
          setPartyRole(null);
        }}
        unitId={Form.useWatch('unit_ids', form)?.[0] ?? null}
        initialData={personModal}
      />
      <ContractorModalId
        open={!!contractorModal}
        onClose={() => {
          setContractorModal(null);
          setPartyRole(null);
        }}
        onSelect={(id) => {
          const field =
            partyRole === 'plaintiff'
              ? 'plaintiff_contractor_ids'
              : 'defendant_contractor_ids';
          const current: number[] = form.getFieldValue(field) || [];
          if (id == null) {
            form.setFieldValue(
              field,
              current.filter((v) => v !== contractorModal?.id),
            );
          } else {
            form.setFieldValue(field, Array.from(new Set([...current, id])));
          }
          setPartyRole(null);
        }}
        initialData={contractorModal}
      />

    </>
  );
}
