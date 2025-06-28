import React from 'react';
import { Table, Switch, Skeleton } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  useRolePermissions,
  useUpsertRolePermission,
} from '@/entities/rolePermission';
import type { RolePermission, RoleName } from '@/shared/types/rolePermission';
import {
  DEFAULT_ROLE_PERMISSIONS,
  PRETRIAL_FLAG,
} from '@/shared/types/rolePermission';

const PAGES = [
  'dashboard',
  'structure',
  'claims',
  'defects',
  'court-cases',
  'correspondence',
  'admin',
];

// Таблицы, для которых можно назначать права на редактирование и удаление.
// Дополнены таблицей "claims" для управления претензиями.
const TABLES = ['defects', 'court_cases', 'letters', 'claims'];

interface RightRow {
  key: string;
  label: string;
  field: 'pages' | 'edit_tables' | 'delete_tables' | 'only_assigned_project';
  value?: string;
}

export default function RolePermissionsAdmin() {
  const { data = [], isLoading } = useRolePermissions();
  const upsert = useUpsertRolePermission();

  const roleNames: RoleName[] = ['ADMIN', 'ENGINEER', 'LAWYER', 'CONTRACTOR'];

  const merged: RolePermission[] = roleNames.map(
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

  const rights: RightRow[] = [
    {
      key: 'only_project',
      label: 'Только свой проект',
      field: 'only_assigned_project',
    },
    {
      key: 'pretrial',
      label: 'Досудебные претензии',
      field: 'pages',
      value: PRETRIAL_FLAG,
    },
    ...PAGES.map((p) => ({
      key: `page_${p}`,
      label: `Страница: ${p}`,
      field: 'pages' as const,
      value: p,
    })),
    ...TABLES.map((t) => ({
      key: `edit_${t}`,
      label: `Редактирование: ${t}`,
      field: 'edit_tables' as const,
      value: t,
    })),
    ...TABLES.map((t) => ({
      key: `delete_${t}`,
      label: `Удаление: ${t}`,
      field: 'delete_tables' as const,
      value: t,
    })),
  ];

  const columns: ColumnsType<RightRow> = [
    {
      title: 'Право',
      dataIndex: 'label',
      width: 200,
    },
    ...roleNames.map((role) => ({
      title: role,
      dataIndex: role,
      render: (_: unknown, row: RightRow) => {
        const record = merged.find((m) => m.role_name === role)!;
        if (row.field === 'only_assigned_project') {
          return (
            <Switch
              size="small"
              checked={record.only_assigned_project}
              onChange={(checked) => handleProjectToggle(role, checked)}
            />
          );
        }
        const value = row.value!;
        const checked = (record[row.field as keyof RolePermission] as string[]).includes(value);
        return (
          <Switch
            size="small"
            checked={checked}
            onChange={() => handleToggle(role, row.field as 'pages' | 'edit_tables' | 'delete_tables', value)}
          />
        );
      },
    })),
  ];

  if (isLoading) return <Skeleton active />;

  return (
    <Table
      rowKey="key"
      pagination={false}
      dataSource={rights}
      columns={columns}
    />
  );
}
