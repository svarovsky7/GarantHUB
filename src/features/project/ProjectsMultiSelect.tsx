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
  value: (number | string)[];
  onChange: (v: (number | string)[]) => void;
}) {
  const { data: projects = [], isPending } = useVisibleProjects();

  const options = React.useMemo(
    () => [
      { value: 'all', label: 'Все проекты' },
      ...projects.map((p) => ({ value: p.id, label: p.name }))
    ],
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
      onChange={(values) => {
        // Если выбрано "Все проекты", очищаем остальные выборы и оставляем только его
        if (values.includes('all') && !value.includes('all')) {
          onChange(['all']);
        } 
        // Если выбран конкретный проект при выбранном "Все проекты", убираем "Все проекты"
        else if (value.includes('all') && values.length > 1) {
          onChange(values.filter(v => v !== 'all'));
        }
        else {
          onChange(values);
        }
      }}
      options={options}
      style={{ minWidth: 260 }}
    />
  );
}
