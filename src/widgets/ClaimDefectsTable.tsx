import React, { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { Table, Button, Form, Input, DatePicker, Tag, Space, Skeleton } from 'antd';
import type { InputRef } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useDefectStatuses } from '@/entities/defectStatus';

interface Props {
  fields: any[];
  add: (defaultValue?: any) => void;
  remove: (index: number) => void;
}

export default function ClaimDefectsTable({ fields, add, remove }: Props) {
  const { data: statuses = [], isPending } = useDefectStatuses();
  const form = Form.useFormInstance();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const refs = useRef<Record<number, InputRef | null>>({});

  useEffect(() => {
    const t = setTimeout(() => setShowSkeleton(true), 300);
    return () => clearTimeout(t);
  }, []);

  const focusField = (idx: number) => {
    setTimeout(() => {
      refs.current[idx]?.focus();
    });
  };

  const handleAdd = () => {
    add({ description: '', deadline: null, executor: 'owner', status_id: statuses[0]?.id ?? null });
    focusField(fields.length);
  };

  const columns: ColumnsType<any> = useMemo(
    () => [
      {
        title: '№',
        dataIndex: 'index',
        width: 40,
        render: (_: any, __: any, i: number) => i + 1,
      },
      {
        title: 'Описание',
        dataIndex: 'description',
        ellipsis: true,
        render: (_: any, field: any, index: number) => (
          <Form.Item name={[field.name, 'description']} noStyle rules={[{ required: true, message: 'Введите описание' }]}>
            <Input ref={(el) => (refs.current[index] = el)} aria-label="Описание дефекта" />
          </Form.Item>
        ),
      },
      {
        title: 'Собс/Подряд',
        dataIndex: 'executor',
        width: 120,
        render: (_: any, field: any) => {
          const val: 'owner' | 'contractor' = Form.useWatch(['defects', field.name, 'executor'], form);
          const text = val === 'contractor' ? 'Подряд' : 'Собс';
          return <Tag style={{ display: 'inline-block', width: 70, textAlign: 'center' }}>{text}</Tag>;
        },
      },
      {
        title: 'Статус',
        dataIndex: 'status_id',
        width: 120,
        render: (_: any, field: any) => {
          const id: number | undefined = Form.useWatch(['defects', field.name, 'status_id'], form);
          const st = statuses.find((s) => s.id === id);
          return st ? <Tag color={st.color || undefined}>{st.name}</Tag> : null;
        },
      },
      {
        title: 'Дедлайн',
        dataIndex: 'deadline',
        width: 160,
        render: (_: any, field: any) => (
          <Form.Item name={[field.name, 'deadline']} noStyle>
            <DatePicker format="DD.MM.YYYY" aria-label="Дедлайн" />
          </Form.Item>
        ),
      },
      {
        title: 'Действия',
        dataIndex: 'actions',
        width: 100,
        render: (_: any, field: any) => (
          <Space>
            <Button size="small" type="text" aria-label="Редактировать" icon={<EditOutlined />} />
            <Button
              size="small"
              type="text"
              danger
              aria-label="Удалить"
              icon={<DeleteOutlined />}
              onClick={() => remove(field.name)}
            />
          </Space>
        ),
      },
    ],
    [remove, statuses],
  );

  if (isPending && showSkeleton) return <Skeleton active paragraph={{ rows: 4 }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 500 }}>Дефекты</span>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          aria-label="Добавить дефект"
        >
          Добавить дефект
        </Button>
      </div>
      <Table rowKey="key" size="small" pagination={false} columns={columns} dataSource={fields} />
    </div>
  );
}
