import React from 'react';
import {
  Card,
  Space,
  Typography,
  Skeleton,
  Avatar,
  Descriptions,
  Tabs,
} from 'antd';
import dayjs from 'dayjs';
import ChangeNameForm from '@/features/user/ChangeNameForm';
import ChangePasswordForm from '@/features/user/ChangePasswordForm';
import UserProjectsEditor from '@/features/user/UserProjectsEditor';
import ActiveProjectSelect from '@/features/user/ActiveProjectSelect';
import { useVisibleProjects } from '@/entities/project';
import { useAuthStore } from '@/shared/store/authStore';
/**
 * Страница личного кабинета пользователя.
 * Отображает основные сведения об аккаунте и формы для управления
 * персональными данными.
 */
export default function ProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const { data: projects = [], isPending } = useVisibleProjects();

  if (!profile) return <Skeleton active />;

  const avatarLetter = profile.name?.charAt(0) ?? profile.email?.charAt(0) ?? '?';

  return (
    <div style={{ maxWidth: 600, margin: '16px auto' }}>
      <Tabs
        defaultActiveKey="account"
        items={[
          {
            key: 'account',
            label: 'Аккаунт',
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card>
                  <Space>
                    <Avatar size={64}>{avatarLetter}</Avatar>
                    <div>
                      <Typography.Title level={4} style={{ margin: 0 }}>
                        {profile.name ?? profile.email}
                      </Typography.Title>
                      <Typography.Text type="secondary">
                        {profile.email}
                      </Typography.Text>
                    </div>
                  </Space>
                  <Descriptions column={1} style={{ marginTop: 16 }}>
                    <Descriptions.Item label="Дата регистрации">
                      {profile.created_at
                        ? dayjs(profile.created_at).format('DD.MM.YYYY')
                        : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Роль">
                      {profile.role ?? '—'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
                <Card title="Проекты">
                  {isPending ? (
                    <Skeleton active />
                  ) : (
                    <UserProjectsEditor projects={projects} />
                  )}
                </Card>
              </Space>
            ),
          },
          {
            key: 'settings',
            label: 'Настройки',
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card title="Активный проект">
                  <ActiveProjectSelect />
                </Card>
                <Card title="ФИО">
                  <ChangeNameForm />
                </Card>
                <Card title="Пароль">
                  <ChangePasswordForm />
                </Card>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
