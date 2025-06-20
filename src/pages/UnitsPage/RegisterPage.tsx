// src/pages/RegisterPage.js
// -----------------------------------------------------------------------------
// Регистрация: проект обязателен, поле «Фамилия Имя», выбор роли ENGINEER | LAWYER | CONTRACTOR.
// -----------------------------------------------------------------------------

import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Form, Input, Select, Button, Typography, Tooltip, Skeleton } from 'antd';
import { useSnackbar } from 'notistack';
import { supabase } from '@/shared/api/supabaseClient';

import { useVisibleProjects } from '@/entities/project';
import { addUserProfile } from '@/entities/user';
import type { RoleName } from '@/shared/types/rolePermission';
import type { RegisterFormValues } from '@/shared/types/register';

const ROLE_OPTIONS: { value: RoleName; label: string }[] = [
  { value: 'ENGINEER', label: 'Инженер Гарантийного отдела' },
  { value: 'LAWYER', label: 'Юрист' },
  { value: 'CONTRACTOR', label: 'Подрядчик' },
];

/**
 * Страница регистрации нового пользователя.
 * Требует выбор проекта и ввод «Фамилия Имя».
 */
export default function RegisterPage() {
  const nav = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [form] = Form.useForm<RegisterFormValues>();
  const [loading, setLoading] = React.useState(false);

  const { data: projects = [], isLoading: projLoad } = useVisibleProjects();

  const options = React.useMemo(
    () => projects.map((p) => ({ label: p.name, value: p.id })),
    [projects],
  );

  /** Отправка формы регистрации */
  const signUp = async (values: RegisterFormValues) => {
    if (!values.project_ids.length) {
      enqueueSnackbar('Выберите проекты', { variant: 'warning' });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
            role: values.role,
            project_ids: values.project_ids,
          },
        },
      });

      if (error) {
        // eslint-disable-next-line no-console
        console.error('[signUp error]', error, JSON.stringify(data, null, 2));
        enqueueSnackbar(error.message, { variant: 'error' });
        return;
      }

      if (data?.user) {
        try {
          await addUserProfile({
            id: data.user.id,
            name: values.name,
            email: values.email,
            role: values.role,
            project_ids: values.project_ids,
          });
        } catch (insertErr) {
          // eslint-disable-next-line no-console
          console.error('[profile insert]', insertErr);
        }
      }

      enqueueSnackbar('Проверьте e-mail — отправили ссылку подтверждения.', {
        variant: 'success',
      });
      setTimeout(() => nav('/login', { replace: true }), 2500);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[signUp unexpected]', err);
      enqueueSnackbar('Неизвестная ошибка регистрации', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: '24px auto' }}>
      <Form form={form} layout="vertical" onFinish={signUp} autoComplete="off">
        <Form.Item>
          <Typography.Title level={3} style={{ textAlign: 'center' }}>
            Регистрация
          </Typography.Title>
        </Form.Item>

            <Form.Item
              name="name"
              label="Фамилия Имя"
              rules={[{ required: true, message: 'Укажите имя' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="email"
              label="E-mail"
              rules={[
                { required: true, message: 'Укажите e-mail' },
                { type: 'email', message: 'Некорректный e-mail' },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="password"
              label="Пароль"
              rules={[{ required: true, message: 'Укажите пароль', min: 6 }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              name="role"
              label="Роль"
              initialValue={ROLE_OPTIONS[0].value}
              rules={[{ required: true, message: 'Выберите роль' }]}
            >
              <Select options={ROLE_OPTIONS} />
            </Form.Item>

            <Form.Item
              name="project_ids"
              label="Проекты"
              rules={[{ required: true, message: 'Выберите проекты' }]}
              tooltip="Без проекта регистрация невозможна"
            >
              {projLoad ? (
                <Skeleton active paragraph={false} />
              ) : (
                <Select
                  mode="multiple"
                  options={options}
                  placeholder="Выберите проекты"
                />
              )}
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              >
                Создать аккаунт
              </Button>
            </Form.Item>

        <Form.Item>
          <Typography.Text style={{ textAlign: 'center', display: 'block' }}>
            Уже зарегистрированы? <RouterLink to="/login">Войти</RouterLink>
          </Typography.Text>
        </Form.Item>
      </Form>
    </div>
  );
}
