import React, { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';
import {
  useAddContractor,
  useUpdateContractor,
  useDeleteContractor,
} from '@/entities/contractor';
import { formatPhone } from '@/shared/utils/formatPhone';
import { useNotify } from '@/shared/hooks/useNotify';

export interface ContractorModalIdProps {
  open: boolean;
  onClose: () => void;
  /**
   * Возвращает id созданной/обновлённой записи или `null`,
   * если контрагент был удалён.
   */
  onSelect: (id: number | null) => void;
  initialData?: any | null;
}

/** Модальное окно создания/редактирования контрагента. Возвращает id */
export default function ContractorModalId({
  open,
  onClose,
  onSelect,
  initialData = null,
}: ContractorModalIdProps) {
  const [form] = Form.useForm();
  const add = useAddContractor();
  const update = useUpdateContractor();
  const remove = useDeleteContractor();
  const notify = useNotify();
  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      form.setFieldsValue(initialData);
    } else {
      form.resetFields();
    }
  }, [open, isEdit, initialData, form]);

  const finish = async (values: any) => {
    try {
      const res = isEdit
        ? await update.mutateAsync({ id: initialData.id, updates: values })
        : await add.mutateAsync(values);
      notify.success(isEdit ? 'Контрагент обновлён' : 'Контрагент создан');
      onSelect(res.id);
      onClose();
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    try {
      await remove.mutateAsync(initialData.id);
      notify.success('Контрагент удалён');
      onSelect(null);
      onClose();
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      title={isEdit ? 'Редактировать контрагента' : 'Новый контрагент'}
      okText="Сохранить"
      cancelText="Отмена"
      afterClose={() => form.resetFields()}
    >
      <Form form={form} layout="vertical" onFinish={finish}>
        <Form.Item name="name" label="Название" rules={[{ required: true, message: 'Укажите название' }]}> 
          <Input />
        </Form.Item>
        <Form.Item
          name="inn"
          label="ИНН"
          rules={[
            { required: true, message: 'Укажите ИНН' },
            { pattern: /^\d{10}$|^\d{12}$/, message: 'ИНН должен содержать 10 или 12 цифр' },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Телефон" getValueFromEvent={(e) => formatPhone(e.target.value)}>
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
