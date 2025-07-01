import React from 'react';
import { Select, Skeleton } from 'antd';
import { useAuthStore } from '@/shared/store/authStore';
import { useVisibleProjects } from '@/entities/project';

/**
 * Выпадающий список для выбора активного проекта пользователя.
 */
export default function ActiveProjectSelect() {
  const projectId = useAuthStore((s) => s.projectId);
  const setProjectId = useAuthStore((s) => s.setProjectId);
  const { data: projects = [], isPending } = useVisibleProjects();

  const options = React.useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects],
  );

  if (isPending) {
    return <Skeleton.Button active size="small" style={{ width: 160 }} />;
  }

  return (
    <Select
      size="small"
      value={projectId ?? undefined}
      onChange={(val) => setProjectId(val)}
      options={options}
      placeholder="Выберите проект"
      style={{ width: '100%' }}
    />
  );
}
