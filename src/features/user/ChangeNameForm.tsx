import React from 'react';
import { Form, Input, Button } from 'antd';
import { useUpdateUserName } from '@/entities/user';
import { useAuthStore } from '@/shared/store/authStore';
import { useNotify } from '@/shared/hooks/useNotify';

/** Форма изменения имени пользователя. */
export default function ChangeNameForm() {
  const profile = useAuthStore((s) => s.profile)!;
  const setProfile = useAuthStore((s) => s.setProfile);
  const update = useUpdateUserName();
  const notify = useNotify();
  const [form] = Form.useForm<{ name: string | null }>();

  React.useEffect(() => {
    form.setFieldsValue({ name: profile.name });
  }, [profile, form]);

  const onSave = () => {
    const name = form.getFieldValue('name');
    update.mutate(
      { id: profile.id, name },
      {
        onSuccess: (data) => {
          setProfile({ ...profile, name: data.name });
          notify.success('Имя обновлено');
        },
        onError: (e) => notify.error(e.message),
      },
    );
  };

  return (
    <Form form={form} layout="vertical">
      <Form.Item label="ФИО" name="name">
        <Input />
      </Form.Item>
      <Form.Item>
        <Button type="primary" onClick={onSave} loading={update.isPending}>
          Сохранить
        </Button>
      </Form.Item>
    </Form>
  );
}
