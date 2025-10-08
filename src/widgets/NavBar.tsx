// src/widgets/NavBar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Select, Skeleton, Typography, Space } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';

import { supabase } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/shared/store/authStore';
import { useVisibleProjects } from '@/entities/project';
import { useRolePermission } from '@/entities/rolePermission';

const NavBar: React.FC = () => {
  const navigate = useNavigate();
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
    { key: 'personal-cabinet', label: 'Личный кабинет', onClick: () => navigate('/personal-cabinet') },
    perm?.pages.includes('structure')       && { key: 'structure',      label: 'Структура проекта', onClick: () => navigate('/structure') },
    perm?.pages.includes('claims')          && { key: 'claims',         label: 'Претензии', onClick: () => navigate('/claims') },
    perm?.pages.includes('defects')         && { key: 'defects',        label: 'Дефекты', onClick: () => navigate('/defects') },
    perm?.pages.includes('court-cases')     && { key: 'court-cases',    label: 'Судебные дела', onClick: () => navigate('/court-cases') },
    perm?.pages.includes('correspondence')  && { key: 'correspondence', label: 'Письма', onClick: () => navigate('/correspondence') },
    { key: 'engineer-calls', label: 'Календарь вызовов', onClick: () => navigate('/engineer-calls') },
    { key: 'documents', label: 'Документы', onClick: () => navigate('/documents') },
    perm?.pages.includes('admin')           && { key: 'admin',          label: 'Администрирование', onClick: () => navigate('/admin') },
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
        <Link
            to="/"
            style={{ color: '#fff', flexShrink: 0, textDecoration: 'none' }}
        >
          <Typography.Title level={4} style={{ color: 'inherit', margin: 0, whiteSpace: 'nowrap' }}>
            Garant&nbsp;HUB
          </Typography.Title>
        </Link>

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
                  paddingRight: 24,            // добавили запас справа, чтобы кнопка "Выйти" не обрезалась
                }}
            >
              <Space direction="vertical" size={0} align="end" style={{ flex: 1, minWidth: 0 }}>
                <Link to="/profile" style={{ textDecoration: 'none' }}>
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
                </Link>

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
