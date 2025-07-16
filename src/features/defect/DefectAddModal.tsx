import React, { Suspense } from 'react';
import { Modal, Form, Spin } from 'antd';
import dayjs from 'dayjs';

// Lazy loading для тяжелого компонента DefectEditableTable
const DefectEditableTable = React.lazy(() => import('@/widgets/DefectEditableTable'));
import type { NewDefect } from '@/entities/defect';
import { useAuthStore } from '@/shared/store/authStore';

interface Props {
  open: boolean;
  projectId?: number | null;
  /** Значение по умолчанию для поля "Дата получения" */
  defaultReceivedAt?: dayjs.Dayjs | null;
  onClose: () => void;
  onSubmit: (defs: NewDefect[]) => void;
}

/**
 * Модальное окно добавления дефектов к претензии.
 */
export default function DefectAddModal({ open, projectId, defaultReceivedAt, onClose, onSubmit }: Props) {
  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    const userId = useAuthStore.getState().profile?.id ?? null;
    const defs: NewDefect[] = (values.defects || []).map((d: any) => ({
      description: d.description || '',
      type_id: d.type_id ?? null,
      status_id: d.status_id ?? null,
      project_id: projectId ?? null,
      unit_id: null,
      brigade_id: d.brigade_id ?? null,
      contractor_id: d.contractor_id ?? null,
      created_by: userId,
      is_warranty: d.is_warranty ?? false,
      received_at: d.received_at ? dayjs(d.received_at).format('YYYY-MM-DD') : null,
      fixed_at: d.fixed_at ? dayjs(d.fixed_at).format('YYYY-MM-DD') : null,
      fixed_by: null,
      engineer_id: null,
    }));
    onSubmit(defs);
    form.resetFields();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      width="80%"
      title="Добавление дефектов"
      okText="Добавить"
      cancelText="Отмена"
    >
      <Form form={form} layout="vertical">
        <Form.List name="defects" initialValue={[]}>
          {(fields, { add, remove }) => (
            <Suspense fallback={<Spin size="large" style={{ display: 'block', textAlign: 'center', padding: '20px' }} />}>
              <DefectEditableTable
                fields={fields}
                add={add}
                remove={remove}
                projectId={projectId ?? null}
                showFiles={false}
                defaultReceivedAt={defaultReceivedAt}
              />
            </Suspense>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
