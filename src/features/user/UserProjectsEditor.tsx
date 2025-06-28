import React from 'react';
import { Select, Tag, Skeleton, Button, Space } from 'antd';
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
  const [selected, setSelected] = React.useState<number[]>(profile.project_ids);

  React.useEffect(() => {
    setSelected(profile.project_ids);
  }, [profile.project_ids]);

  const options = React.useMemo(
    () => projects.map((p) => ({ label: p.name, value: p.id })),
    [projects],
  );

  const save = () => {
    update.mutate(
      { id: profile.id, projectIds: selected },
      {
        onSuccess: () => setProjectIds(selected),
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
    <Space direction="vertical" style={{ width: '100%' }}>
      <Select
        mode="multiple"
        size="small"
        autoFocus
        open
        style={{ width: '100%' }}
        value={selected}
        onChange={setSelected}
        options={options}
        loading={update.isPending}
      />
      <div>
        <Button type="primary" size="small" onClick={save} loading={update.isPending}>
          Сохранить
        </Button>
        <Button
          size="small"
          onClick={() => {
            setSelected(profile.project_ids);
            setEditing(false);
          }}
          style={{ marginLeft: 8 }}
        >
          Отмена
        </Button>
      </div>
    </Space>
  );
}
