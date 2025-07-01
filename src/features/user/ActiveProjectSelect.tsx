import React from 'react';
import { Select, Skeleton, Button, Space } from 'antd';
import { useAuthStore } from '@/shared/store/authStore';
import { useVisibleProjects } from '@/entities/project';

/**
 * Выпадающий список для выбора активного проекта пользователя.
 */
export default function ActiveProjectSelect() {
  const projectId = useAuthStore((s) => s.projectId);
  const setProjectId = useAuthStore((s) => s.setProjectId);
  const [selected, setSelected] = React.useState<number | null>(projectId);

  React.useEffect(() => {
    setSelected(projectId);
  }, [projectId]);
  const { data: projects = [], isPending } = useVisibleProjects();

  const options = React.useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects],
  );

  if (isPending) {
    return <Skeleton.Button active size="small" style={{ width: 160 }} />;
  }

  const save = () => setProjectId(selected);
  const cancel = () => setSelected(projectId);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Select
        size="small"
        value={selected ?? undefined}
        onChange={(val) => setSelected(val)}
        options={options}
        placeholder="Выберите проект"
        style={{ width: '100%' }}
      />
      {selected !== projectId && (
        <div>
          <Button type="primary" size="small" onClick={save}>
            Сохранить
          </Button>
          <Button size="small" onClick={cancel} style={{ marginLeft: 8 }}>
            Отмена
          </Button>
        </div>
      )}
    </Space>
  );
}
