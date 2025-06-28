import React from 'react';
import { Card, Space, Typography, Skeleton } from 'antd';
import ChangeNameForm from '@/features/user/ChangeNameForm';
import ChangePasswordForm from '@/features/user/ChangePasswordForm';
import UserProjectsEditor from '@/features/user/UserProjectsEditor';
import { useVisibleProjects } from '@/entities/project';
import { useAuthStore } from '@/shared/store/authStore';

/** Страница личного кабинета пользователя. */
export default function ProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const { data: projects = [], isPending } = useVisibleProjects();

  if (!profile) return <Skeleton active />;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="ФИО">
        <ChangeNameForm />
      </Card>

      <Card title="Пароль">
        <ChangePasswordForm />
      </Card>

      <Card title="Проекты">
        {isPending ? (
          <Skeleton active />
        ) : (
          <UserProjectsEditor projects={projects} />
        )}
      </Card>

      <Card title="Ваша роль">
        <Typography.Text>{profile.role}</Typography.Text>
      </Card>
    </Space>
  );
}
