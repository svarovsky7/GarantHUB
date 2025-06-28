import React from 'react';
import dayjs from 'dayjs';
import {
  Table,
  Input,
  Select,
  DatePicker,
  Switch,
  Button,
  Tooltip,
  Space,
  Skeleton,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined } from '@ant-design/icons';
import FixBySelector from '@/shared/ui/FixBySelector';
import DefectFilesLoader from './DefectFilesLoader';
import DefectStatusSelect from '@/features/defect/DefectStatusSelect';

interface Item {
  id: number;
  description: string;
  type_id: number | null;
  status_id: number | null;
  brigade_id: number | null;
  contractor_id: number | null;
  is_warranty: boolean;
  received_at: string | null;
  fixed_at: string | null;
}

interface Option {
  id: number;
  name: string;
}

interface Props {
  items: Item[];
  defectTypes: Option[];
  statuses: Option[];
  brigades: Option[];
  contractors: Option[];
  onChange: (id: number, field: keyof Item, value: any) => void;
  onRemove?: (id: number) => void;
  onView?: (id: number) => void;
  loading?: boolean;
}

/**
 * Редактируемая таблица дефектов внутри просмотра претензии.
 */
export default function TicketDefectsEditorTable({
  items,
  defectTypes,
  statuses,
  brigades,
  contractors,
  onChange,
  onRemove,
  onView,
  loading,
}: Props) {
  const fmt = (d: string | null) => (d ? dayjs(d).format('DD.MM.YYYY') : undefined);

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

  const columns: ColumnsType<Item> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      width: 200,
      ellipsis: true,
      render: (v: string, row) => (
        <Tooltip title={v}>
          <Input.TextArea
            autoSize
            value={v}
            onChange={(e) => onChange(row.id, 'description', e.target.value)}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Тип',
      dataIndex: 'type_id',
      width: 160,
      render: (v: number | null, row) => (
        <Select
          size="small"
          allowClear
          value={v ?? undefined}
          style={{ width: '100%' }}
          options={defectTypes.map((t) => ({ value: t.id, label: t.name }))}
          onChange={(val) => onChange(row.id, 'type_id', val ?? null)}
        />
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status_id',
      width: 160,
      render: (_: number | null, row) => (
        <DefectStatusSelect
          defectId={row.id}
          statusId={row.status_id}
          statusName={statuses.find((s) => s.id === row.status_id)?.name}
          statusColor={statuses.find((s) => s.id === row.status_id)?.color}
        />
      ),
    },
    {
      title: 'Гарантия',
      dataIndex: 'is_warranty',
      width: 80,
      render: (v: boolean, row) => (
        <Switch
          size="small"
          checked={v}
          onChange={(val) => onChange(row.id, 'is_warranty', val)}
        />
      ),
    },
    {
      title: 'Дата получения',
      dataIndex: 'received_at',
      width: 130,
      render: (v: string | null, row) => (
        <DatePicker
          size="small"
          value={v ? dayjs(v) : undefined}
          format="DD.MM.YYYY"
          style={{ width: '100%' }}
          onChange={(d) => onChange(row.id, 'received_at', d ? d.format('YYYY-MM-DD') : null)}
        />
      ),
    },
    {
      title: 'Дата устранения',
      dataIndex: 'fixed_at',
      width: 130,
      render: (v: string | null, row) => (
        <DatePicker
          size="small"
          value={v ? dayjs(v) : undefined}
          format="DD.MM.YYYY"
          style={{ width: '100%' }}
          onChange={(d) => onChange(row.id, 'fixed_at', d ? d.format('YYYY-MM-DD') : null)}
        />
      ),
    },
    {
      title: 'Исполнитель',
      dataIndex: 'brigade_id',
      width: 200,
      render: (_: any, row) => (
        <FixBySelector
          value={{ brigade_id: row.brigade_id, contractor_id: row.contractor_id }}
          brigades={brigades}
          contractors={contractors}
          onChange={(val) => {
            onChange(row.id, 'brigade_id', val.brigade_id);
            onChange(row.id, 'contractor_id', val.contractor_id);
          }}
        />
      ),
    },
  ];

  if (onRemove || onView) {
    columns.push({
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_, row) => (
        <Space size="middle">
          {onView && (
            <Tooltip title="Просмотр">
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => onView(row.id)}
              />
            </Tooltip>
          )}
          {onRemove && (
            <Button size="small" danger onClick={() => onRemove(row.id)}>
              Удалить
            </Button>
          )}
        </Space>
      ),
    });
  }

  return (
    <Table
      rowKey="id"
      rowClassName={(row) => (row.id < 0 ? 'new-row' : '')}
      columns={columns}
      dataSource={items}
      pagination={false}
      size="small"
      expandable={{
        expandedRowRender: (record) => (
          <DefectFilesLoader defectId={record.id} />
        ),
        rowExpandable: () => true,
      }}
    />
  );
}

