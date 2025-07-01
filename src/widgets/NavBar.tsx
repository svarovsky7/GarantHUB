// src/widgets/NavBar.tsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Layout, Menu, Button, Select, Skeleton, Typography, Space } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

import { supabase } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/shared/store/authStore';
import { useVisibleProjects } from '@/entities/project';
import { useRolePermission } from '@/entities/rolePermission';

const NavBar: React.FC = () => {
  const profile     = useAuthStore((s) => s.profile);
  const projectId   = useAuthStore((s) => s.projectId);
  const setProfile  = useAuthStore((s) => s.setProfile);
  const setProjectId = useAuthStore((s) => s.setProjectId);

  const { data: projects = [], isPending } = useVisibleProjects();
  const { data: perm } = useRolePermission(profile?.role as any);

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const items = [
    perm?.pages.includes('structure')       && { key: 'structure',      label: <RouterLink to="/structure">Структура проекта</RouterLink> },
    perm?.pages.includes('claims')          && { key: 'claims',         label: <RouterLink to="/claims">Претензии</RouterLink> },
    perm?.pages.includes('defects')         && { key: 'defects',        label: <RouterLink to="/defects">Дефекты</RouterLink> },
    perm?.pages.includes('court-cases')     && { key: 'court-cases',    label: <RouterLink to="/court-cases">Судебные дела</RouterLink> },
    perm?.pages.includes('correspondence')  && { key: 'correspondence', label: <RouterLink to="/correspondence">Письма</RouterLink> },
    perm?.pages.includes('admin')           && { key: 'admin',          label: <RouterLink to="/admin">Администрирование</RouterLink> },
  ].filter(Boolean);

  return (
      <Layout.Header
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: 24,                 // аккуратный отступ между элементами
            position: 'sticky',      // закрепляем навбар при прокрутке
            top: 0,
            zIndex: 1000,
            width: '100%',
          }}
      >
        {/* Логотип */}
        <RouterLink
            to="/"
            style={{ color: '#fff', flexShrink: 0 }}
        >
          <Typography.Title level={4} style={{ color: 'inherit', margin: 0, whiteSpace: 'nowrap' }}>
            Garant&nbsp;HUB
          </Typography.Title>
        </RouterLink>

        {/* Меню */}
        <Menu
            theme="dark"
            mode="horizontal"
            selectable={false}
            items={items as any}
            style={{
              flex: '1 0 auto',      // занимает всё свободное место и сжимается
              minWidth: 0,           // позволяет сжиматься до 0
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
        />

        {/* Пользователь и выход */}
        {profile && (
            <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  maxWidth: 1000,              // ⬅️ лимит ширины: ничего не «ломает» строку
                  overflow: 'hidden',
                  columnGap: 12,
                }}
            >
              <Space direction="vertical" size={0} align="end" style={{ flex: 1, minWidth: 0 }}>
                <RouterLink to="/profile">
                  <Typography.Text
                      style={{
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        display: 'block',
                      }}
                  >
                    {profile.name ? `${profile.name} (${profile.email})` : profile.email}
                  </Typography.Text>
                </RouterLink>

                {perm?.only_assigned_project && (
                    isPending ? (
                        <Skeleton active title={false} paragraph={false} style={{ width: 120 }} />
                    ) : (
                        <Typography.Text
                            type="secondary"
                            style={{
                              color: 'rgba(255,255,255,0.85)',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              display: 'block',
                            }}
                            title={projects.map((p) => p.name).join('; ')}  // полный список всплывает подсказкой
                        >
                          {projects.map((p) => p.name).join('; ') || '—'}
                        </Typography.Text>
                    )
                )}
              </Space>

              <Button
                  type="link"
                  icon={<LogoutOutlined />}
                  onClick={logout}
                  style={{ color: '#fff' }}
              >
                Выйти
              </Button>
            </div>
        )}
      </Layout.Header>
  );
};

export default NavBar;
