import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Skeleton,
  Tooltip,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useDefectTypes } from '@/entities/defectType';
import { useDefectStatuses } from '@/entities/defectStatus';
import type { ColumnsType } from 'antd/es/table';

/**
 * Props for {@link DefectEditableTable}
 */
interface Props {
  fields: any[];
  add: () => void;
  remove: (index: number) => void;
}

/**
 * Editable table for adding defects inside ticket form.
 * Shows skeleton until defect types and statuses are loaded.
 */
export default function DefectEditableTable({ fields, add, remove }: Props) {
  const { data: defectTypes = [], isPending: loadingTypes } = useDefectTypes();
  const { data: defectStatuses = [], isPending: loadingStatuses } = useDefectStatuses();

  const columns: ColumnsType<any> = useMemo(
    () => [
      {
        title: '#',
        dataIndex: 'index',
        width: 40,
        render: (_: any, __: any, i: number) => i + 1,
      },
      {
        title: 'Описание дефекта',
        dataIndex: 'description',
        ellipsis: true,
        render: (_: any, field: any) => (
          <Form.Item name={[field.name, 'description']} noStyle>
            <Input.TextArea size="small" autoSize placeholder="Описание" />
          </Form.Item>
        ),
      },
      {
        title: 'Статус',
        dataIndex: 'status_id',
        ellipsis: true,
        render: (_: any, field: any) => (
          <Form.Item name={[field.name, 'status_id']} noStyle initialValue={defectStatuses[0]?.id}>
            <Select
              size="small"
              placeholder="Статус"
              options={defectStatuses.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>
        ),
      },
      {
        title: 'Тип',
        dataIndex: 'type_id',
        ellipsis: true,
        render: (_: any, field: any) => (
          <Form.Item name={[field.name, 'type_id']} noStyle>
            <Select
              size="small"
              placeholder="Тип"
              options={defectTypes.map((d) => ({ value: d.id, label: d.name }))}
            />
          </Form.Item>
        ),
      },
      {
        title: 'Дата получения',
        dataIndex: 'received_at',
        ellipsis: true,
        render: (_: any, field: any) => (
          <Form.Item name={[field.name, 'received_at']} noStyle initialValue={dayjs()}>
            <DatePicker size="small" format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        ),
      },
      {
        title: 'Дата устранения',
        dataIndex: 'fixed_at',
        ellipsis: true,
        render: (_: any, field: any) => (
          <Form.Item name={[field.name, 'fixed_at']} noStyle>
            <DatePicker size="small" format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        ),
      },
      {
        title: 'Кем устраняется',
        dataIndex: 'fix_by',
        ellipsis: true,
        render: (_: any, field: any) => (
          <Form.Item name={[field.name, 'fix_by']} noStyle initialValue="own">
            <Select
              size="small"
              options={[
                { value: 'own', label: 'Собственные силы' },
                { value: 'contractor', label: 'Подрядчик' },
              ]}
            />
          </Form.Item>
        ),
      },
      {
        title: '',
        dataIndex: 'actions',
        width: 60,
        render: (_: any, field: any) => (
          <Tooltip title="Удалить">
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => remove(field.name)}
            />
          </Tooltip>
        ),
      },
    ],
    [defectTypes, defectStatuses, remove],
  );

  if (loadingTypes || loadingStatuses) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 500 }}>Дефекты</span>
        <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()}>
          Добавить дефект
        </Button>
      </div>
      <Table
        size="small"
        pagination={false}
        rowKey="key"
        columns={columns}
        dataSource={fields}
      />
    </div>
  );
}
