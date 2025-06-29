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
} from 'antd';
import { Dayjs } from 'dayjs';
import { useVisibleProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
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
      form.setFieldsValue({ unit_ids: [] });
    }
    prevProjectIdRef.current = projectId ?? null;
  }, [projectId]);

  const { data: projects = [] } = useVisibleProjects();
  const { data: units = [], isPending: unitsLoading } = useUnitsByProject(projectId);
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
  const [partySelect, setPartySelect] = useState<{ role: 'plaintiff' | 'defendant' } | null>(null);
  const [plaintiffType, setPlaintiffType] = useState<'person' | 'contractor'>('person');
  const [defendantType, setDefendantType] = useState<'person' | 'contractor'>('contractor');
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

  const handleAddCase = async (values: any) => {
    try {
      const uidId = await getOrCreateCaseUid(values.case_uid);
      const newCase = await addCaseMutation.mutateAsync({
        project_id: values.project_id,
        unit_ids: values.unit_ids || [],
        number: values.number,
        date: values.date.format('YYYY-MM-DD'),
        case_uid_id: uidId,
        plaintiff_person_id:
          plaintiffType === 'person' ? values.plaintiff_id : null,
        plaintiff_contractor_id:
          plaintiffType === 'contractor' ? values.plaintiff_id : null,
        defendant_person_id:
          defendantType === 'person' ? values.defendant_id : null,
        defendant_contractor_id:
          defendantType === 'contractor' ? values.defendant_id : null,
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

  const plaintiffId = Form.useWatch('plaintiff_id', form);
  const defendantId = Form.useWatch('defendant_id', form);

  return (
    <>
      <Form form={form} layout="vertical" onFinish={handleAddCase} autoComplete="off">
        {/* Row 1: Project, Object, Lawyer */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="project_id" label="Проект" rules={[{ required: true, message: 'Выберите проект' }]}> 
              <Select options={projects.map((p) => ({ value: p.id, label: p.name }))} />
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
          <Col span={8}>
            <Form.Item name="responsible_lawyer_id" label="Ответственный юрист" rules={[{ required: true, message: 'Выберите юриста' }]}> 
              <Select loading={usersLoading} options={users.map((u) => ({ value: u.id, label: u.name }))} />
            </Form.Item>
          </Col>
        </Row>
        {/* Row UID */}
        <Row gutter={16}>
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
        {/* Row 2 */}
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
        {/* Row 3 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Истец" style={{ marginBottom: 0 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio.Group value={plaintiffType} onChange={(e) => setPlaintiffType(e.target.value)}>
                  <Radio.Button value="person">Физлицо</Radio.Button>
                  <Radio.Button value="contractor">Контрагент</Radio.Button>
                </Radio.Group>
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="plaintiff_id" noStyle rules={[{ required: true, message: 'Выберите истца' }]}> 
                    {plaintiffType === 'person' ? (
                      <Select
                        loading={personsLoading}
                        options={projectPersons.map((p) => ({ value: p.id, label: p.full_name }))}
                        disabled={!projectId}
                      />
                    ) : (
                      <Select loading={contractorsLoading} options={contractors.map((c) => ({ value: c.id, label: c.name }))} />
                    )}
                  </Form.Item>
                  <Button icon={<PlusOutlined />} onClick={() => setPartySelect({ role: 'plaintiff' })} />
                  <Button
                    icon={<EditOutlined />}
                    disabled={!plaintiffId}
                    onClick={() => {
                      const id = form.getFieldValue('plaintiff_id');
                      const data =
                        plaintiffType === 'person'
                          ? personsList.find((p) => p.id === id) || null
                          : contractors.find((c) => c.id === id) || null;
                      plaintiffType === 'person' ? setPersonModal(data) : setContractorModal(data);
                    }}
                  />
                  <Popconfirm
                    title={plaintiffType === 'person' ? 'Удалить физлицо?' : 'Удалить контрагента?'}
                    okText="Да"
                    cancelText="Нет"
                    onConfirm={() => {
                      const id = form.getFieldValue('plaintiff_id');
                      if (!id) return;
                      if (plaintiffType === 'person') {
                        deletePersonMutation.mutate(id);
                      } else {
                        deleteContractorMutation.mutate(id);
                      }
                    }}
                    disabled={!plaintiffId}
                  >
                    <Button icon={<DeleteOutlined />} disabled={!plaintiffId} />
                  </Popconfirm>
                </Space.Compact>
              </Space>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Ответчик" style={{ marginBottom: 0 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio.Group value={defendantType} onChange={(e) => setDefendantType(e.target.value)}>
                  <Radio.Button value="person">Физлицо</Radio.Button>
                  <Radio.Button value="contractor">Контрагент</Radio.Button>
                </Radio.Group>
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="defendant_id" noStyle rules={[{ required: true, message: 'Выберите ответчика' }]}> 
                    {defendantType === 'person' ? (
                      <Select loading={personsLoading} options={projectPersons.map((p) => ({ value: p.id, label: p.full_name }))} />
                    ) : (
                      <Select loading={contractorsLoading} options={contractors.map((c) => ({ value: c.id, label: c.name }))} />
                    )}
                  </Form.Item>
                  <Button icon={<PlusOutlined />} onClick={() => setPartySelect({ role: 'defendant' })} />
                  <Button
                    icon={<EditOutlined />}
                    disabled={!defendantId}
                    onClick={() => {
                      const id = form.getFieldValue('defendant_id');
                      const data =
                        defendantType === 'person'
                          ? personsList.find((p) => p.id === id) || null
                          : contractors.find((c) => c.id === id) || null;
                      defendantType === 'person' ? setPersonModal(data) : setContractorModal(data);
                    }}
                  />
                  <Popconfirm
                    title={defendantType === 'person' ? 'Удалить физлицо?' : 'Удалить контрагента?'}
                    okText="Да"
                    cancelText="Нет"
                    onConfirm={() => {
                      const id = form.getFieldValue('defendant_id');
                      if (!id) return;
                      if (defendantType === 'person') {
                        deletePersonMutation.mutate(id);
                      } else {
                        deleteContractorMutation.mutate(id);
                      }
                    }}
                    disabled={!defendantId}
                  >
                    <Button icon={<DeleteOutlined />} disabled={!defendantId} />
                  </Popconfirm>
                </Space.Compact>
              </Space>
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

      <Modal open={!!partySelect} onCancel={() => setPartySelect(null)} footer={null} title="Кого добавить?">
        <Space>
          <Button
            onClick={() => {
              setPartyRole(partySelect!.role);
              setPersonModal({});
              setPartySelect(null);
            }}
          >
            Физлицо
          </Button>
          <Button
            onClick={() => {
              setPartyRole(partySelect!.role);
              setContractorModal({});
              setPartySelect(null);
            }}
          >
            Контрагент
          </Button>
        </Space>
      </Modal>
      <PersonModalId
        open={!!personModal}
        onClose={() => {
          setPersonModal(null);
          setPartyRole(null);
        }}
        unitId={Form.useWatch('unit_ids', form)?.[0] ?? null}
        onSelect={(id) => {
          if (partyRole === 'defendant') {
            form.setFieldValue('defendant_id', id);
          } else {
            form.setFieldValue('plaintiff_id', id);
          }
          setPartyRole(null);
        }}
        initialData={personModal}
      />
      <ContractorModalId
        open={!!contractorModal}
        onClose={() => {
          setContractorModal(null);
          setPartyRole(null);
        }}
        onSelect={(id) => {
          if (partyRole === 'plaintiff') {
            form.setFieldValue('plaintiff_id', id);
          } else {
            form.setFieldValue('defendant_id', id);
          }
          setPartyRole(null);
        }}
        initialData={contractorModal}
      />

    </>
  );
}
