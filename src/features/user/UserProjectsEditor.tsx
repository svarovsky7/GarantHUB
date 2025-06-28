import React from 'react';
import { Select, Tag, Skeleton } from 'antd';
import { useUpdateUserProjects } from '@/entities/user';
import { useAuthStore } from '@/shared/store/authStore';
import type { Project } from '@/shared/types/project';

/** Редактор проектов в личном кабинете. */
export default function UserProjectsEditor({
  projects,
  loading = false,
}: {
  projects: Project[];
  loading?: boolean;
}) {
  const profile = useAuthStore((s) => s.profile)!;
  const setProjectIds = useAuthStore((s) => s.setProjectIds);
  const update = useUpdateUserProjects();
  const [editing, setEditing] = React.useState(false);

  const options = React.useMemo(
    () => projects.map((p) => ({ label: p.name, value: p.id })),
    [projects],
  );

  const handleChange = (vals: number[]) => {
    update.mutate(
      { id: profile.id, projectIds: vals },
      {
        onSuccess: () => setProjectIds(vals),
      },
    );
    setEditing(false);
  };

  const tags = profile.project_ids
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
      defaultValue={profile.project_ids}
      onBlur={() => setEditing(false)}
      onChange={handleChange}
      options={options}
      loading={update.isPending}
    />
  );
}
