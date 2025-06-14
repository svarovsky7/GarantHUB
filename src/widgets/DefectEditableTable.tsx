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
  Tag,
  Space,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useDefectTypes } from '@/entities/defectType';
import { useDefectStatuses } from '@/entities/defectStatus';
import { useDefectDeadlines } from '@/entities/defectDeadline';
import type { ColumnsType } from 'antd/es/table';

/**
 * Props for {@link DefectEditableTable}
 */
interface Props {
  fields: any[];
  add: () => void;
  remove: (index: number) => void;
  /** ID выбранного проекта, используется для сроков устранения */
  projectId?: number | null;
}

/**
 * Editable table for adding defects inside ticket form.
 * Shows skeleton until defect types and statuses are loaded.
 */
export default function DefectEditableTable({ fields, add, remove, projectId }: Props) {
  const { data: defectTypes = [], isPending: loadingTypes } = useDefectTypes();
  const { data: defectStatuses = [], isPending: loadingStatuses } = useDefectStatuses();
  const { data: deadlines = [] } = useDefectDeadlines();
  const form = Form.useFormInstance();

  const getFixDays = (typeId: number | null | undefined) => {
    if (!projectId || !typeId) return null;
    const rec = deadlines.find(
      (d) => d.project_id === projectId && d.defect_type_id === typeId,
    );
    return rec?.fix_days ?? null;
  };

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
        width: 240,
        ellipsis: true,
        render: (_: any, field: any) => (
          <Form.Item
            name={[field.name, 'description']}
            noStyle
            rules={[{ required: true, message: 'Введите описание' }]}
          >
            <Input.TextArea size="small" autoSize placeholder="Описание" />
          </Form.Item>
        ),
      },
      {
        title: 'Статус',
        dataIndex: 'status_id',
        width: 180,
        ellipsis: true,
        render: (_: any, field: any) => (
          <Form.Item
            name={[field.name, 'status_id']}
            noStyle
            rules={[{ required: true, message: 'Выберите статус' }]}
            initialValue={defectStatuses[0]?.id}
          >
            <Select
              size="small"
              placeholder="Статус"
              style={{ minWidth: 160 }}
              dropdownMatchSelectWidth={false}
              options={defectStatuses.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>
        ),
      },
      {
        title: 'Тип',
        dataIndex: 'type_id',
        width: 200,
        ellipsis: true,
        render: (_: any, field: any) => (
          <Form.Item
            name={[field.name, 'type_id']}
            noStyle
            rules={[{ required: true, message: 'Выберите тип' }]}
            initialValue={defectTypes[0]?.id}
          >
            <Select
              size="small"
              placeholder="Тип"
              style={{ minWidth: 160 }}
              dropdownMatchSelectWidth={false}
              options={defectTypes.map((d) => ({ value: d.id, label: d.name }))}
            />
          </Form.Item>
        ),
      },
      {
        title: 'Дата получения',
        dataIndex: 'received_at',
        width: 200,
        ellipsis: true,
        render: (_: any, field: any) => (
          <Space direction="vertical" size={2}>
            <Form.Item
              name={[field.name, 'received_at']}
              noStyle
              rules={[{ required: true, message: 'Укажите дату' }]}
              initialValue={dayjs()}
            >
              <DatePicker size="small" format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
            <Space size={4}>
              {[10, 45, 60].map((d) => (
                <Tag
                  key={d}
                  color="blue"
                  onClick={() => {
                    const rec = form.getFieldValue(['defects', field.name, 'received_at']);
                    if (rec) {
                      form.setFieldValue(
                        ['defects', field.name, 'fixed_at'],
                        dayjs(rec).add(d, 'day'),
                      );
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  +{d}
                </Tag>
              ))}
              {(() => {
                const t = form.getFieldValue(['defects', field.name, 'type_id']);
                const fd = getFixDays(t);
                return fd ? (
                  <Tag
                    color="green"
                    onClick={() => {
                      const rec = form.getFieldValue(['defects', field.name, 'received_at']);
                      if (rec) {
                        form.setFieldValue(
                          ['defects', field.name, 'fixed_at'],
                          dayjs(rec).add(fd, 'day'),
                        );
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    +{fd}
                  </Tag>
                ) : null;
              })()}
            </Space>
          </Space>
        ),
      },
      {
        title: 'Дата устранения',
        dataIndex: 'fixed_at',
        width: 180,
        ellipsis: true,
        render: (_: any, field: any) => (
          <Form.Item
            name={[field.name, 'fixed_at']}
            noStyle
            rules={[{ required: true, message: 'Укажите дату' }]}
          >
            <DatePicker size="small" format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        ),
      },
      {
        title: 'Кем устраняется',
        dataIndex: 'fix_by',
        width: 180,
        ellipsis: true,
        render: (_: any, field: any) => (
          <Form.Item
            name={[field.name, 'fix_by']}
            noStyle
            rules={[{ required: true, message: 'Выберите исполнителя' }]}
          >
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
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() =>
            add({
              description: '',
              status_id: defectStatuses[0]?.id ?? null,
              type_id: defectTypes[0]?.id ?? null,
              received_at: dayjs(),
              fixed_at: null,
              fix_by: null,
            })
          }
        >
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
