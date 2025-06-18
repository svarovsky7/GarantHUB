import React from 'react';
import { Select, Tag, Skeleton } from 'antd';
import { useUpdateUserRole } from '@/entities/user';
import type { User } from '@/shared/types/user';
import type { Role } from '@/shared/types/role';

interface RoleSelectProps {
  user: User;
  roles: Role[];
  /** Показывать скелетон вместо контента */
  loading?: boolean;
}

/**
 * Инлайн-редактор роли пользователя.
 * При клике на текущее значение открывает выпадающий список Ant Design.
 */
export default function RoleSelect({
  user,
  roles,
  loading = false,
}: RoleSelectProps) {
  const updateRole = useUpdateUserRole();
  const [editing, setEditing] = React.useState(false);

  const options = React.useMemo(
    () => roles.map((r) => ({ label: r.name, value: r.name })),
    [roles],
  );

  const handleChange = (value: string) => {
    updateRole.mutate({ id: user.id, newRole: value });
    setEditing(false);
  };

  if (loading) return <Skeleton.Button active size="small" style={{ width: 100 }} />;

  if (!editing) {
    return (
      <Tag color="blue" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
        {user.role ?? '—'}
      </Tag>
    );
  }

  return (
    <Select
      size="small"
      autoFocus
      open
      defaultValue={user.role ?? undefined}
      onBlur={() => setEditing(false)}
      onChange={handleChange}
      loading={updateRole.isPending}
      options={options}
      style={{ width: '100%' }}
    />
  );
}

