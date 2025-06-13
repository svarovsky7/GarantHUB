import React, { useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAddPerson,
  useUpdatePerson,
  useDeletePerson,
} from '@/entities/person';
import { supabase } from '@/shared/api/supabaseClient';
import { formatPhone } from '@/shared/utils/formatPhone';

interface PersonModalProps {
  open: boolean;
  onClose: () => void;
  unitId?: number | null;
  onSelect: (fullName: string) => void;
  initialData?: any | null;
}

/** Модальное окно создания/редактирования физлица */
export default function PersonModal({
  open,
  onClose,
  unitId = null,
  onSelect,
  initialData = null,
}: PersonModalProps) {
  const [form] = Form.useForm();
  const add = useAddPerson();
  const update = useUpdatePerson();
  const remove = useDeletePerson();
  const qc = useQueryClient();
  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (isEdit) {
      form.setFieldsValue(initialData);
    } else {
      form.resetFields();
    }
  }, [isEdit, initialData, form]);

  const handleFinish = async (values: any) => {
    try {
      const res = isEdit
        ? await update.mutateAsync({ id: initialData.id, updates: values })
        : await add.mutateAsync(values);
      // unit_persons table removed
      message.success(isEdit ? 'Физлицо обновлено' : 'Физлицо добавлено');
      qc.invalidateQueries({ queryKey: ['projectPersons'] });
      onSelect(res.full_name);
      form.resetFields();
      onClose();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    try {
      await remove.mutateAsync(initialData.id);
      message.success('Физлицо удалено');
      qc.invalidateQueries({ queryKey: ['projectPersons'] });
      onSelect('');
      onClose();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      title={isEdit ? 'Редактировать физлицо' : 'Новое физлицо'}
      okText="Сохранить"
      cancelText="Отмена"
      afterClose={() => form.resetFields()}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="full_name"
          label="ФИО"
          rules={[{ required: true, message: 'Укажите ФИО' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="passport_series" label="Серия паспорта">
          <Input maxLength={4} />
        </Form.Item>
        <Form.Item name="passport_number" label="Номер паспорта">
          <Input maxLength={6} />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Телефон"
          getValueFromEvent={(e) => formatPhone(e.target.value)}
        >
          <Input placeholder="+7 (9xx) xxx-xx-xx" />
        </Form.Item>
        <Form.Item name="email" label="Email">
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Описание">
          <Input.TextArea rows={2} />
        </Form.Item>
        {isEdit && (
          <Form.Item>
            <a onClick={handleDelete} style={{ color: 'red' }}>
              Удалить
            </a>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
