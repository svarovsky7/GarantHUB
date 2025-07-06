import React from 'react';
import { Table, Switch, Skeleton, Card, Space, Typography } from 'antd';
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

/** Основные разделы приложения */
const MAIN_PAGES = ['dashboard', 'structure', 'claims'];
/** Работа с обращениями и дефектами */
const WORK_PAGES = ['defects', 'court-cases', 'correspondence'];
/** Администрирование */
const ADMIN_PAGES = ['admin'];
/** Все страницы, доступные для назначения прав */
const PAGES = [...MAIN_PAGES, ...WORK_PAGES, ...ADMIN_PAGES];

// Таблицы, для которых можно назначать права на редактирование и удаление.
// Дополнены таблицей "claims" для управления претензиями.
const TABLES = ['defects', 'court_cases', 'letters', 'claims'];

interface RightRow {
  key: string;
  label: string;
  field:
    | 'pages'
    | 'edit_tables'
    | 'delete_tables'
    | 'only_assigned_project'
    | 'can_lock_units';
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

  const handleBoolToggle = (
    role: RoleName,
    field: 'only_assigned_project' | 'can_lock_units',
    value: boolean,
  ) => {
    const current = merged.find((m) => m.role_name === role)!;
    upsert.mutate({ ...current, [field]: value });
  };

  /** Общие права, не привязанные к разделам */
  const generalRights: RightRow[] = [
    { key: 'only_project', label: 'Только свой проект', field: 'only_assigned_project' },
    { key: 'pretrial', label: 'Досудебные претензии', field: 'pages', value: PRETRIAL_FLAG },
    { key: 'lock_unit', label: 'Блокировка объектов', field: 'can_lock_units' },
  ];

  /** Доступ к разделам приложения */
  const pageRights: RightRow[] = PAGES.map((p) => ({
    key: `page_${p}`,
    label: `Стр. ${p}`,
    field: 'pages' as const,
    value: p,
  }));

  /** Разрешение на редактирование справочников */
  const editRights: RightRow[] = TABLES.map((t) => ({
    key: `edit_${t}`,
    label: `Редакт. ${t}`,
    field: 'edit_tables' as const,
    value: t,
  }));

  /** Разрешение на удаление записей */
  const deleteRights: RightRow[] = TABLES.map((t) => ({
    key: `delete_${t}`,
    label: `Удал. ${t}`,
    field: 'delete_tables' as const,
    value: t,
  }));


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
        if (row.field === 'only_assigned_project' || row.field === 'can_lock_units') {
          return (
            <Switch
              size="small"
              checked={record[row.field as keyof RolePermission] as boolean}
              onChange={(checked) =>
                handleBoolToggle(role, row.field as 'only_assigned_project' | 'can_lock_units', checked)
              }
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
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Доступ к страницам" size="small">
        <Table
          rowKey="key"
          pagination={false}
          dataSource={pageRights}
          columns={columns}
        />
      </Card>

      <Card title="Редактирование и удаление" size="small">
        <Table
          rowKey="key"
          pagination={false}
          dataSource={[...editRights, ...deleteRights]}
          columns={columns}
        />
      </Card>

      <Card title="Особые функции" size="small">
        <Table
          rowKey="key"
          pagination={false}
          dataSource={generalRights}
          columns={columns}
        />
      </Card>
    </Space>
  );
}
