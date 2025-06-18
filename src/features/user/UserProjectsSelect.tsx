import React from 'react';
import { Select, Tag, Skeleton } from 'antd';
import { useUpdateUserProjects } from '@/entities/user';
import type { User } from '@/shared/types/user';
import type { Project } from '@/shared/types/project';

interface UserProjectsSelectProps {
  user: User;
  projects: Project[];
  loading?: boolean;
}

/**
 * Множественный выбор проектов для пользователя.
 * Отображает теги выбранных проектов и позволяет быстро изменять список.
 */
export default function UserProjectsSelect({
  user,
  projects,
  loading = false,
}: UserProjectsSelectProps) {
  const updateProjects = useUpdateUserProjects();
  const [editing, setEditing] = React.useState(false);

  const options = React.useMemo(
    () => projects.map((p) => ({ label: p.name, value: p.id })),
    [projects],
  );

  const handleChange = (vals: number[]) => {
    updateProjects.mutate({ id: user.id, projectIds: vals });
    setEditing(false);
  };

  const tags = user.project_ids
    .map((id) => projects.find((p) => p.id === id)?.name)
    .filter(Boolean) as string[];

  if (loading) return <Skeleton.Button active size="small" style={{ width: 160 }} />;

  if (!editing) {
    return (
      <div onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
        {tags.length ? tags.map((t) => <Tag key={t}>{t}</Tag>) : <Tag>—</Tag>}
      </div>
    );
  }

  return (
    <Select
      mode="multiple"
      size="small"
      autoFocus
      open
      style={{ width: '100%' }}
      defaultValue={user.project_ids}
      onBlur={() => setEditing(false)}
      onChange={handleChange}
      options={options}
      loading={updateProjects.isPending}
    />
  );
}
