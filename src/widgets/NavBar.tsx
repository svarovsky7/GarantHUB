// src/widgets/NavBar.tsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Layout, Menu, Button, Select, Skeleton, Typography, Space, Spin } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

import { supabase } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/shared/store/authStore';
import { useVisibleProjects } from '@/entities/project';
import { useRolePermission } from '@/entities/rolePermission';

/**
 * Навигационная панель приложения.
 * Отображает ссылки по ролям, профиль пользователя и выбор проекта.
 */
const NavBar: React.FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const projectId = useAuthStore((s) => s.projectId);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setProjectId = useAuthStore((s) => s.setProjectId);

  const { data: projects = [], isPending } = useVisibleProjects();
  const { data: perm } = useRolePermission(profile?.role as any);

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const items = [
    perm?.pages.includes('structure') && {
      key: 'structure',
      label: <RouterLink to="/structure">Структура проекта</RouterLink>,
    },
    perm?.pages.includes('defects') && {
      key: 'defects',
      label: <RouterLink to="/defects">Дефекты</RouterLink>,
    },
    perm?.pages.includes('claims') && {
      key: 'claims',
      label: <RouterLink to="/claims">Претензии</RouterLink>,
    },
    perm?.pages.includes('court-cases') && {
      key: 'court-cases',
      label: <RouterLink to="/court-cases">Судебные дела</RouterLink>,
    },
    perm?.pages.includes('correspondence') && {
      key: 'correspondence',
      label: <RouterLink to="/correspondence">Письма</RouterLink>,
    },
    perm?.pages.includes('admin') && {
      key: 'admin',
      label: <RouterLink to="/admin">Администрирование</RouterLink>,
    },
  ].filter(Boolean);

  return (
    <Layout.Header style={{ display: 'flex', alignItems: 'center' }}>
      <RouterLink to="/" style={{ color: '#fff', marginRight: 24 }}>
        <Typography.Title level={4} style={{ color: 'inherit', margin: 0 }}>
          Garantie Hub
        </Typography.Title>
      </RouterLink>
      <Menu theme="dark" mode="horizontal" selectable={false} items={items as any} style={{ flex: 1 }} />
      {profile && (
        <Space direction="horizontal" size="middle" style={{ marginLeft: 'auto' }}>
          <Space direction="vertical" size={0} align="end">
            <Typography.Text style={{ color: '#fff' }}>
              {profile.name ? `${profile.name} (${profile.email})` : profile.email}
            </Typography.Text>
            {perm?.only_assigned_project ? (
              isPending ? (
                <Skeleton active title={false} paragraph={false} style={{ width: 120 }} />
              ) : (
                <Typography.Text type="secondary">
                  {projects.map((p) => p.name).join('; ') || '—'}
                </Typography.Text>
              )
            ) : null}
            {profile.role === 'ADMIN' && !perm?.only_assigned_project && (
              isPending ? (
                <Spin size="small" />
              ) : (
                <Select
                  size="small"
                  value={projectId ?? ''}
                  onChange={(val) => setProjectId(val === '' ? null : Number(val))}
                  style={{ width: 120 }}
                  allowClear
                  placeholder="Проект"
                >
                  {projects.map((p) => (
                    <Select.Option key={p.id} value={p.id}>
                      {p.name}
                    </Select.Option>
                  ))}
                </Select>
              )
            )}
          </Space>
          <Button type="link" icon={<LogoutOutlined />} onClick={logout} style={{ color: '#fff' }}>
            Выйти
          </Button>
        </Space>
      )}
    </Layout.Header>
  );
};

export default NavBar;
