import React from 'react';
import { Form, Input, Button, Typography } from 'antd';
import { useChangePassword } from '@/entities/user';
import { useNotify } from '@/shared/hooks/useNotify';

/** Форма смены пароля пользователя. */
export default function ChangePasswordForm() {
  const [form] = Form.useForm<{ password: string }>();
  const changePass = useChangePassword();
  const notify = useNotify();

  const onSave = () => {
    const password = form.getFieldValue('password');
    changePass.mutate(password, {
      onSuccess: () => {
        notify.success('Пароль изменён');
        form.resetFields();
      },
      onError: (e) => notify.error(e.message),
    });
  };

  return (
    <Form form={form} layout="vertical">
      <Form.Item
        label="Новый пароль"
        name="password"
        rules={[{ required: true, min: 6, message: 'Минимум 6 символов' }]}
      >
        <Input.Password />
      </Form.Item>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Просмотр текущего пароля невозможен
      </Typography.Paragraph>
      <Form.Item>
        <Button type="primary" onClick={onSave} loading={changePass.isPending}>
          Изменить пароль
        </Button>
      </Form.Item>
    </Form>
  );
}
