import React from 'react';
import { Select, Skeleton } from 'antd';
import { useVisibleProjects } from '@/entities/project';

/**
 * Множественный выбор проектов для дашборда.
 */
export default function ProjectsMultiSelect({
  value,
  onChange,
}: {
  value: number[];
  onChange: (v: number[]) => void;
}) {
  const { data: projects = [], isPending } = useVisibleProjects();

  const options = React.useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects],
  );

  if (isPending) {
    return <Skeleton.Input active style={{ width: 260 }} />;
  }

  return (
    <Select
      mode="multiple"
      allowClear
      placeholder="Выберите проекты"
      value={value}
      onChange={onChange}
      options={options}
      style={{ minWidth: 260 }}
    />
  );
}
