import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import {
  useContractorCompletion,
  useAddContractorCompletion,
  useUpdateContractorCompletion,
} from '@/entities/contractorCompletion';
import { useContractors } from '@/entities/contractor';
import { useVisibleProjects } from '@/entities/project';
import { useAuthStore } from '@/shared/store/authStore';
import type { ContractorCompletionCreate } from '@/shared/types/contractorCompletion';

interface Props {
  open: boolean;
  completionId: number | null;
  onClose: () => void;
}

export default function CompletionFormModal({ open, completionId, onClose }: Props) {
  const [form] = Form.useForm();
  const userId = useAuthStore((s) => s.profile?.id);

  const { data: completion } = useContractorCompletion(completionId);
  const { data: contractors = [] } = useContractors();
  const { data: projects = [] } = useVisibleProjects();

  const addCompletion = useAddContractorCompletion();
  const updateCompletion = useUpdateContractorCompletion();

  useEffect(() => {
    if (open && completion) {
      form.setFieldsValue({
        larix_number: completion.larix_number,
        contractor_id: completion.contractor_id,
        project_id: completion.project_id,
      });
    } else if (open && !completionId) {
      form.resetFields();
    }
  }, [open, completion, completionId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (completionId) {
        await updateCompletion.mutateAsync({
          id: completionId,
          updates: values,
        });
        message.success('Выполнение обновлено');
      } else {
        const data: ContractorCompletionCreate = {
          ...values,
          created_by: userId || null,
        };
        await addCompletion.mutateAsync(data);
        message.success('Выполнение создано');
      }

      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Modal
      title={completionId ? 'Редактировать выполнение' : 'Новое выполнение'}
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={addCompletion.isPending || updateCompletion.isPending}
      width={600}
      okText="Сохранить"
      cancelText="Отмена"
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="larix_number"
          label="Номер Larix"
          rules={[{ required: true, message: 'Введите номер Larix' }]}
        >
          <Input placeholder="Уникальный номер из системы Larix" />
        </Form.Item>

        <Form.Item
          name="contractor_id"
          label="Контрагент"
          rules={[{ required: true, message: 'Выберите контрагента' }]}
        >
          <Select
            showSearch
            placeholder="Выберите контрагента"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={contractors.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="project_id"
          label="Проект"
          rules={[{ required: true, message: 'Выберите проект' }]}
        >
          <Select
            showSearch
            placeholder="Выберите проект"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={projects.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
