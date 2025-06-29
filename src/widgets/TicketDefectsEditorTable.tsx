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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, PaperClipOutlined, DownOutlined } from '@ant-design/icons';
import FixBySelector from '@/shared/ui/FixBySelector';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import DefectFilesModal from '@/features/defect/DefectFilesModal';
import type { NewDefectFile } from '@/shared/types/defectFile';
import type { RemoteClaimFile } from '@/shared/types/claimFile';

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
  fileMap?: Record<number, NewDefectFile[]>;
  remoteFileMap?: Record<number, RemoteClaimFile[]>;
  onFilesChange?: (id: number, files: NewDefectFile[]) => void;
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
  fileMap = {},
  remoteFileMap = {},
  onFilesChange,
}: Props) {
  const fmt = (d: string | null) => (d ? dayjs(d).format('DD.MM.YYYY') : undefined);

  const [fileModalId, setFileModalId] = React.useState<number | null>(null);
  const [expandedKeys, setExpandedKeys] = React.useState<React.Key[]>([]);

  const columns: ColumnsType<Item> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: 'Описание',
      dataIndex: 'description',
      width: 200,
      render: (v: string, row) => (
        <Input.TextArea
          autoSize
          value={v}
          onChange={(e) => onChange(row.id, 'description', e.target.value)}
        />
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
      render: (v: number | null, row) => (
        <Select
          size="small"
          allowClear
          value={v ?? undefined}
          style={{ width: '100%' }}
          options={statuses.map((s) => ({ value: s.id, label: s.name }))}
          onChange={(val) => onChange(row.id, 'status_id', val ?? null)}
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
      width: 120,
      render: (_, row) => (
        <Space size="middle">
          <Tooltip title="Файлы">
            <Button
              size="small"
              type="text"
              icon={<PaperClipOutlined />}
              onClick={() => setFileModalId(row.id)}
            />
          </Tooltip>
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
    <>
    <Table
      rowKey="id"
      rowClassName={(row) => (row.id < 0 ? 'new-row' : '')}
      columns={columns}
      dataSource={items}
      expandable={{
        expandedRowKeys: expandedKeys,
        onExpand: (exp, record) => {
          const key = record.id;
          setExpandedKeys((p) =>
            exp ? [...p, key] : p.filter((k) => k !== key),
          );
        },
        expandIcon: ({ expanded, onExpand, record }) => {
          const has =
            (fileMap[record.id] ?? []).length > 0 ||
            (remoteFileMap[record.id] ?? []).length > 0;
          if (!has) return null;
          return (
            <DownOutlined
              style={{ cursor: 'pointer', color: '#52c41a', fontWeight: 700 }}
              rotate={expanded ? 180 : 0}
              onClick={(e) => onExpand(record, e)}
            />
          );
        },
        expandedRowRender: (record) => {
          const files = fileMap[record.id] ?? [];
          const remotes = remoteFileMap[record.id] ?? [];
          if (!files.length && !remotes.length) return null;
          return (
            <AttachmentEditorTable
              remoteFiles={remotes.map((f) => ({
                id: String(f.id),
                name: f.name,
                path: f.path,
                mime: f.mime_type,
                description: f.description ?? '',
              }))}
              newFiles={files.map((f) => ({ file: f.file, mime: f.file.type, description: f.description }))}
              onRemoveNew={(idx) => {
                const arr = files.filter((_, i) => i !== idx);
                onFilesChange?.(record.id, arr);
              }}
              onDescNew={(idx, d) => {
                const arr = files.map((ff, i) => (i === idx ? { ...ff, description: d } : ff));
                onFilesChange?.(record.id, arr);
              }}
              showMime={false}
              showDetails
            />
          );
        },
      }}
      pagination={false}
      size="small"
    />
    <DefectFilesModal
      open={fileModalId !== null}
      files={fileModalId !== null ? fileMap[fileModalId] ?? [] : []}
      onChange={(f) => fileModalId !== null && onFilesChange?.(fileModalId, f)}
      onClose={() => setFileModalId(null)}
    />
    </>
  );
}

