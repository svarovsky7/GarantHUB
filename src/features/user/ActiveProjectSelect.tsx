import React from 'react';
import { Select, Skeleton, Button, Space } from 'antd';
import { useAuthStore } from '@/shared/store/authStore';
import { useVisibleProjects } from '@/entities/project';
import { useNotify } from '@/shared/hooks/useNotify';

/**
 * Выпадающий список для выбора активного проекта пользователя.
 */
export default function ActiveProjectSelect() {
  const projectId = useAuthStore((s) => s.projectId);
  const setProjectId = useAuthStore((s) => s.setProjectId);
  const { data: projects = [], isPending } = useVisibleProjects();
  const notify = useNotify();

  const [selected, setSelected] = React.useState<number | null>(projectId);

  React.useEffect(() => {
    setSelected(projectId);
  }, [projectId]);

  const options = React.useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects],
  );

  if (isPending) {
    return <Skeleton.Button active size="small" style={{ width: 160 }} />;
  }

  const onSave = () => {
    setProjectId(selected);
    notify.success('Активный проект сохранён');
  };

  return (
    <Space.Compact block>
      <Select
        size="small"
        value={selected ?? undefined}
        onChange={(val) => setSelected(val)}
        options={options}
        placeholder="Выберите проект"
      />
      {selected !== projectId && (
        <Button size="small" type="primary" onClick={onSave}>
          Сохранить
        </Button>
      )}
    </Space.Compact>
  );
}
