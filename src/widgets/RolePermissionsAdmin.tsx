import React from 'react';
import { Table, Switch, Skeleton } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  useRolePermissions,
  useUpsertRolePermission,
} from '@/entities/rolePermission';
import type { RolePermission, RoleName } from '@/shared/types/rolePermission';
import { DEFAULT_ROLE_PERMISSIONS } from '@/shared/types/rolePermission';

const PAGES = [
  'dashboard',
  'structure',
  'tickets',
  'claims',
  'defects',
  'court-cases',
  'correspondence',
  'admin',
];

// Список таблиц, для которых можно настроить права на редактирование и удаление
// Дополнен таблицей "claims" для управления претензиями
const TABLES = ['tickets', 'defects', 'court_cases', 'letters', 'claims'];

export default function RolePermissionsAdmin() {
  const { data = [], isLoading } = useRolePermissions();
  const upsert = useUpsertRolePermission();

  const merged: RolePermission[] = (['ADMIN', 'ENGINEER', 'LAWYER', 'CONTRACTOR'] as RoleName[]).map(
    (r) => data.find((d) => d.role_name === r) ?? DEFAULT_ROLE_PERMISSIONS[r],
  );

  const handleToggle = (
    role: RoleName,
    field: 'pages' | 'edit_tables' | 'delete_tables',
    value: string,
  ) => {
    const current = merged.find((m) => m.role_name === role)!;
    const list = new Set(current[field]);
    if (list.has(value)) list.delete(value);
    else list.add(value);
    upsert.mutate({ ...current, [field]: Array.from(list) });
  };

  const handleProjectToggle = (role: RoleName, value: boolean) => {
    const current = merged.find((m) => m.role_name === role)!;
    upsert.mutate({ ...current, only_assigned_project: value });
  };

  const columns: ColumnsType<RolePermission> = [
    {
      title: 'Роль',
      dataIndex: 'role_name',
    },
    {
      title: 'Только свой проект',
      dataIndex: 'only_assigned_project',
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.only_assigned_project}
          onChange={(checked) =>
            handleProjectToggle(record.role_name as RoleName, checked)
          }
        />
      ),
    },
    {
      title: 'Доступные страницы',
      render: (_, record) => (
        <div>
          {PAGES.map((p) => (
            <div key={p} style={{ marginBottom: 4 }}>
              <Switch
                size="small"
                checked={record.pages.includes(p)}
                onChange={() => handleToggle(record.role_name as RoleName, 'pages', p)}
              />{' '}
              {p}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Редактирование',
      render: (_, record) => (
        <div>
          {TABLES.map((t) => (
            <div key={t} style={{ marginBottom: 4 }}>
              <Switch
                size="small"
                checked={record.edit_tables.includes(t)}
                onChange={() => handleToggle(record.role_name as RoleName, 'edit_tables', t)}
              />{' '}
              {t}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Удаление',
      render: (_, record) => (
        <div>
          {TABLES.map((t) => (
            <div key={t} style={{ marginBottom: 4 }}>
              <Switch
                size="small"
                checked={record.delete_tables.includes(t)}
                onChange={() => handleToggle(record.role_name as RoleName, 'delete_tables', t)}
              />{' '}
              {t}
            </div>
          ))}
        </div>
      ),
    },
  ];

  if (isLoading) return <Skeleton active />;

  return <Table rowKey="role_name" pagination={false} dataSource={merged} columns={columns} />;
}
