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
  Radio,
  Upload,
  Switch,
} from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { useDefectTypes } from '@/entities/defectType';
import { useDefectStatuses } from '@/entities/defectStatus';
import { useDefectDeadlines } from '@/entities/defectDeadline';
import { useBrigades } from '@/entities/brigade';
import { useContractors } from '@/entities/contractor';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd/es/form';
import type { NewDefectFile } from '@/shared/types/defectFile';

/**
 * Props for {@link DefectEditableTable}
 */
interface Props {
  fields: any[];
  add: (defaultValue?: any) => void;
  remove: (index: number) => void;
  /** ID выбранного проекта, используется для сроков устранения */
  projectId?: number | null;
  /** Карта файлов по индексу дефекта */
  fileMap?: Record<number, NewDefectFile[]>;
  /** Изменение файлов по индексу */
  onFilesChange?: (index: number, files: NewDefectFile[]) => void;
  /** Показывать колонку загрузки файлов */
  showFiles?: boolean;
}

/**
 * Поле выбора исполнителя дефекта: собственная бригада или подрядчик.
 * Используется внутри таблицы редактирования дефектов.
 */
interface FixByFieldProps {
  field: any;
  /** Ссылка на форму дефекта */
  form: FormInstance;
  /** Список собственных бригад */
  brigades: Array<{ id: number; name: string }>;
  /** Список подрядчиков */
  contractors: Array<{ id: number; name: string }>;
}

const FixByField: React.FC<FixByFieldProps> = React.memo(
  ({ field, form, brigades, contractors }) => {
    const brigadePath = [field.name, 'brigade_id'];
    const contractorPath = [field.name, 'contractor_id'];
    const brigadeVal: number | undefined = Form.useWatch(brigadePath, form);
    const contractorVal: number | undefined = Form.useWatch(contractorPath, form);
    const [mode, setMode] = React.useState<'brigade' | 'contractor'>(
      contractorVal ? 'contractor' : 'brigade',
    );

    const handleModeChange = (value: 'brigade' | 'contractor') => {
      setMode(value);
      if (value === 'brigade') {
        form.setFieldValue(contractorPath, null);
      } else {
        form.setFieldValue(brigadePath, null);
      }
    };

    React.useEffect(() => {
      if (contractorVal && mode !== 'contractor') {
        setMode('contractor');
      } else if (brigadeVal && mode !== 'brigade') {
        setMode('brigade');
      }
    }, [brigadeVal, contractorVal]);

    const namePath = mode === 'brigade' ? brigadePath : contractorPath;
    const options = (mode === 'brigade' ? brigades : contractors).map((b) => ({
      value: b.id,
      label: b.name,
    }));

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Radio.Group
          size="small"
          value={mode}
          onChange={(e) => handleModeChange(e.target.value)}
        >
          <Radio.Button value="brigade">Собст</Radio.Button>
          <Radio.Button value="contractor">Подряд</Radio.Button>
        </Radio.Group>
        <Form.Item name={namePath} noStyle>
          <Select
            key={mode}
            size="small"
            placeholder="Исполнитель"
            showSearch
            style={{ width: '100%' }}
            options={options}
            filterOption={(i, o) =>
              (o?.label ?? '').toLowerCase().includes(i.toLowerCase())
            }
          />
        </Form.Item>
      </Space>
    );
  },
);

/**
 * Editable table for adding defects inside ticket form.
 * Shows skeleton until defect types and statuses are loaded.
 */
export default function DefectEditableTable({ fields, add, remove, projectId, fileMap = {}, onFilesChange, showFiles = true }: Props) {
  const { data: defectTypes = [], isPending: loadingTypes } = useDefectTypes();
  const { data: defectStatuses = [], isPending: loadingStatuses } = useDefectStatuses();
  const { data: deadlines = [] } = useDefectDeadlines();
  const { data: brigades = [] } = useBrigades();
  const { data: contractors = [] } = useContractors();
  const form = Form.useFormInstance();

  const getFixDays = (typeId: number | null | undefined) => {
    if (!projectId || !typeId) return null;
    const rec = deadlines.find(
      (d) => d.project_id === projectId && d.defect_type_id === typeId,
    );
    return rec?.fix_days ?? null;
  };


  const columns: ColumnsType<any> = useMemo(
    () =>
      [
      {
        title: '#',
        dataIndex: 'index',
        width: 40,
        render: (_: any, __: any, i: number) => i + 1,
      },
      {
        title: (
          <span>
            Описание дефекта<span style={{ color: 'red' }}>*</span>
          </span>
        ),
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
        title: (
          <span>
            Статус<span style={{ color: 'red' }}>*</span>
          </span>
        ),
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
              popupMatchSelectWidth={false}
              options={defectStatuses.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>
        ),
      },
      {
        title: (
          <span>
            Тип<span style={{ color: 'red' }}>*</span>
          </span>
        ),
        dataIndex: 'type_id',
        width: 200,
        ellipsis: true,
        render: (_: any, field: any) => (
          <Form.Item
            name={[field.name, 'type_id']}
            noStyle
            rules={[{ required: true, message: 'Выберите тип' }]}
          >
            <Select
              size="small"
              placeholder="Тип"
              showSearch
              filterOption={(i, o) =>
                (o?.label ?? '').toLowerCase().includes(i.toLowerCase())
              }
              style={{ minWidth: 160, width: '100%' }}
              popupMatchSelectWidth={false}
              options={defectTypes.map((d) => ({ value: d.id, label: d.name }))}
            />
          </Form.Item>
        ),
      },
      {
        title: 'Гарантия',
        dataIndex: 'is_warranty',
        width: 100,
        render: (_: any, field: any) => (
          <Form.Item name={[field.name, 'is_warranty']} valuePropName="checked" noStyle initialValue={false}>
            <Switch size="small" />
          </Form.Item>
        ),
      },
      {
        title: (
          <span>
            Дата получения<span style={{ color: 'red' }}>*</span>
          </span>
        ),
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
        title: (
          <span>
            Дата устранения<span style={{ color: 'red' }}>*</span>
          </span>
        ),
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
        dataIndex: 'executor',
        width: 180,
        ellipsis: true,
        render: (_: any, field: any) => (
          <FixByField
            field={field}
            form={form}
            brigades={brigades}
            contractors={contractors}
          />
        ),
      },
      showFiles
        ? {
            title: 'Файлы',
            dataIndex: 'files',
            width: 200,
            render: (_: any, field: any) => (
              <Upload
                multiple
                beforeUpload={(file) => {
                  const cur = fileMap[field.name] ?? [];
                  const arr = [...cur, { file, type_id: null }];
                  onFilesChange?.(field.name, arr);
                  return false;
                }}
                onRemove={(info) => {
                  const cur = fileMap[field.name] ?? [];
                  const idx = Number(info.uid);
                  const arr = cur.filter((_, i) => i !== idx);
                  onFilesChange?.(field.name, arr);
                  return false;
                }}
                fileList={(fileMap[field.name] ?? []).map((f, i) => ({
                  uid: String(i),
                  name: f.file.name,
                  status: 'done',
                }))}
              >
                <Button size="small" icon={<UploadOutlined />}>Загрузить</Button>
              </Upload>
            ),
          }
        : null,
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
    ].filter(Boolean),
    [defectTypes, defectStatuses, remove, showFiles, fileMap],
  );

  if (loadingTypes || loadingStatuses) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 500 }}>Дефекты</span>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            add({
              description: '',
              status_id: defectStatuses[0]?.id ?? null,
              type_id: null,
              is_warranty: false,
              received_at: dayjs(),
              fixed_at: null,
              brigade_id: null,
              contractor_id: null,
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
