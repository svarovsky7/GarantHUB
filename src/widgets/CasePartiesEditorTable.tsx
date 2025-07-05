import React, { useState } from 'react';
import { Table, Button, Select, Popconfirm, Tooltip, Skeleton, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  useCaseParties,
  useAddCaseParties,
  useUpdateCaseParty,
  useDeleteCaseParty,
} from '@/entities/courtCaseParty';
import { usePersons } from '@/entities/person';
import { useContractors } from '@/entities/contractor';
import type { CourtCaseParty, CasePartyRole } from '@/shared/types/courtCaseParty';
import { useNotify } from '@/shared/hooks/useNotify';

interface ModalState {
  mode: 'add' | 'edit';
  data?: (CourtCaseParty & { type: 'person' | 'contractor'; name: string });
}

interface Props {
  caseId: number;
  projectId: number;
}

const ROLE_OPTIONS = [
  { value: 'plaintiff', label: 'Истец' },
  { value: 'defendant', label: 'Ответчик' },
];

export default function CasePartiesEditorTable({ caseId, projectId }: Props) {
  const { data: parties = [], isPending: loadingParties } = useCaseParties(caseId);
  const { data: persons = [] } = usePersons();
  const { data: contractors = [] } = useContractors();
  const addParties = useAddCaseParties();
  const updateParty = useUpdateCaseParty();
  const deleteParty = useDeleteCaseParty();
  const notify = useNotify();
  const [modal, setModal] = useState<ModalState | null>(null);

  const tableData = parties.map((p) => ({
    ...p,
    type: p.person_id ? 'person' : 'contractor',
    name: p.persons?.full_name ?? p.contractors?.name ?? '',
  }));

  const columns: ColumnsType<typeof tableData[number]> = [
    {
      title: 'Роль',
      dataIndex: 'role',
      width: 140,
      render: (v: CasePartyRole, row) => (
        <Select
          size="small"
          value={v}
          options={ROLE_OPTIONS}
          onChange={(val) => updateParty.mutate({ id: row.id, updates: { role: val } })}
        />
      ),
    },
    {
      title: 'Сторона',
      dataIndex: 'name',
      render: (v: string, row) => v,
    },
    {
      title: '',
      dataIndex: 'actions',
      width: 80,
      render: (_: unknown, row) => (
        <>
          <Tooltip title="Редактировать">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => setModal({ mode: 'edit', data: row })}
            />
          </Tooltip>
          <Popconfirm
            title="Удалить сторону?"
            okText="Да"
            cancelText="Нет"
            onConfirm={() => deleteParty.mutate(row.id)}
          >
            <Tooltip title="Удалить">
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </>
      ),
    },
  ];

  const handleSubmit = async (values: {
    role: CasePartyRole;
    type: 'person' | 'contractor';
    entityId: number;
  }) => {
    try {
      if (modal?.mode === 'add') {
        await addParties.mutateAsync([
          {
            case_id: caseId,
            project_id: projectId,
            role: values.role,
            person_id: values.type === 'person' ? values.entityId : null,
            contractor_id: values.type === 'contractor' ? values.entityId : null,
          },
        ]);
        notify.success('Сторона добавлена');
      } else if (modal?.data) {
        await updateParty.mutateAsync({
          id: modal.data.id,
          updates: {
            role: values.role,
            person_id: values.type === 'person' ? values.entityId : null,
            contractor_id: values.type === 'contractor' ? values.entityId : null,
          },
        });
        notify.success('Сторона обновлена');
      }
      setModal(null);
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  if (loadingParties) {
    return <Skeleton active paragraph={{ rows: 3 }} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 500 }}>Стороны дела</span>
        <Button type="dashed" icon={<PlusOutlined />} onClick={() => setModal({ mode: 'add' })}>
          Добавить сторону
        </Button>
      </div>
      <Table rowKey="id" size="small" pagination={false} columns={columns} dataSource={tableData} />
      {modal && (
        <CasePartyModal
          open
          persons={persons}
          contractors={contractors}
          initial={modal.mode === 'edit' ? modal.data : undefined}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

interface ModalProps {
  open: boolean;
  persons: { id: number; full_name: string }[];
  contractors: { id: number; name: string }[];
  initial?: { role: CasePartyRole; type: 'person' | 'contractor'; entityId: number };
  onClose: () => void;
  onSubmit: (values: { role: CasePartyRole; type: 'person' | 'contractor'; entityId: number }) => void;
}

function CasePartyModal({ open, persons, contractors, initial, onClose, onSubmit }: ModalProps) {
  const [role, setRole] = useState<CasePartyRole>('plaintiff');
  const [type, setType] = useState<'person' | 'contractor'>('person');
  const [entityId, setEntityId] = useState<number | undefined>();

  React.useEffect(() => {
    if (open) {
      setRole(initial?.role ?? 'plaintiff');
      setType(initial?.type ?? 'person');
      setEntityId(initial?.entityId);
    }
  }, [open, initial]);

  const options =
    type === 'person'
      ? persons.map((p) => ({ value: p.id, label: p.full_name }))
      : contractors.map((c) => ({ value: c.id, label: c.name }));

  const handleOk = () => {
    if (entityId != null) {
      onSubmit({ role, type, entityId });
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      title={initial ? 'Редактировать сторону' : 'Добавить сторону'}
      okText="Сохранить"
      cancelText="Отмена"
      afterClose={() => setEntityId(undefined)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Select value={role} options={ROLE_OPTIONS} onChange={(v) => setRole(v as CasePartyRole)} />
        <Select
          value={type}
          options={[
            { value: 'person', label: 'Физлицо' },
            { value: 'contractor', label: 'Контрагент' },
          ]}
          onChange={(v) => setType(v as 'person' | 'contractor')}
        />
        <Select
          showSearch
          allowClear
          placeholder={type === 'person' ? 'Выберите физлицо' : 'Выберите контрагента'}
          value={entityId}
          options={options}
          onChange={(v) => setEntityId(v)}
          filterOption={(input, option) =>
            String(option?.label ?? '')
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />
      </div>
    </Modal>
  );
}
