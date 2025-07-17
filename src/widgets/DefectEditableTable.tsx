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
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useDefectTypes } from '@/entities/defectType';
import { useDefectStatuses } from '@/entities/defectStatus';
import { useBrigades } from '@/entities/brigade';
import { useContractors } from '@/entities/contractor';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd/es/form';
import type { NewDefectFile } from '@/shared/types/defectFile';
import DefectFilesModal from '@/features/defect/DefectFilesModal';

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
  /** Дата по умолчанию для поля "Дата получения" */
  defaultReceivedAt?: dayjs.Dayjs | null;
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
    
    // Оптимизация: не используем Form.useWatch при каждом рендере
    const [mode, setMode] = React.useState<'brigade' | 'contractor'>('brigade');
    const [brigadeVal, setBrigadeVal] = React.useState<number | undefined>(undefined);
    const [contractorVal, setContractorVal] = React.useState<number | undefined>(undefined);

    // Получаем начальные значения только при монтировании
    React.useEffect(() => {
      const initialBrigadeVal = form.getFieldValue(brigadePath);
      const initialContractorVal = form.getFieldValue(contractorPath);
      
      setBrigadeVal(initialBrigadeVal);
      setContractorVal(initialContractorVal);
      
      if (initialContractorVal) {
        setMode('contractor');
      } else {
        setMode('brigade');
      }
    }, []);

    const handleModeChange = (value: 'brigade' | 'contractor') => {
      setMode(value);
      if (value === 'brigade') {
        form.setFieldValue(contractorPath, null);
        setContractorVal(undefined);
      } else {
        form.setFieldValue(brigadePath, null);
        setBrigadeVal(undefined);
      }
    };

    const handleValueChange = (value: number | undefined) => {
      if (mode === 'brigade') {
        setBrigadeVal(value);
      } else {
        setContractorVal(value);
      }
    };

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
            onChange={handleValueChange}
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
const DefectEditableTable = React.memo<Props>(({ fields, add, remove, projectId, fileMap = {}, onFilesChange, showFiles = true, defaultReceivedAt }) => {
  const { data: defectTypes = [], isPending: loadingTypes } = useDefectTypes();
  const { data: defectStatuses = [], isPending: loadingStatuses } = useDefectStatuses();
  const { data: brigades = [] } = useBrigades();
  const { data: contractors = [] } = useContractors();
  const form = Form.useFormInstance();

  const [fileModalIdx, setFileModalIdx] = React.useState<number | null>(null);
  const [expandedKeys, setExpandedKeys] = React.useState<React.Key[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  // Мемоизируем опции для селектов
  const defectStatusOptions = useMemo(
    () => defectStatuses.map((s) => ({ value: s.id, label: s.name })),
    [defectStatuses]
  );

  const defectTypeOptions = useMemo(
    () => defectTypes.map((t) => ({ value: t.id, label: t.name })),
    [defectTypes]
  );

  // Мемоизируем обработчик добавления дефекта
  const handleAddDefect = React.useCallback(() => {
    add({
      description: '',
      status_id: defectStatuses[0]?.id ?? null,
      type_id: null,
      is_warranty: false,
      received_at: defaultReceivedAt ?? dayjs(),
      fixed_at: null,
      brigade_id: null,
      contractor_id: null,
    });
  }, [add, defectStatuses, defaultReceivedAt]);

  // Мемоизируем функции для expandable
  const handleExpand = React.useCallback((exp: boolean, record: any) => {
    const key = record.key;
    setExpandedKeys((p) =>
      exp ? [...p, key] : p.filter((k) => k !== key),
    );
  }, []);

  const renderExpandIcon = React.useCallback(({ expanded, onExpand, record }: any) => {
    const has = (fileMap[record.name] ?? []).length > 0;
    if (!has) return null;
    return (
      <DownOutlined
        style={{ cursor: 'pointer', color: '#52c41a', fontWeight: 700 }}
        rotate={expanded ? 180 : 0}
        onClick={(e) => onExpand(record, e)}
      />
    );
  }, [fileMap]);

  const renderExpandedRow = React.useCallback((record: any) => {
    const files = fileMap[record.name] ?? [];
    if (!files.length) return null;
    return (
      <AttachmentEditorTable
        newFiles={files.map((f) => ({ file: f.file, mime: f.file.type, description: f.description }))}
        onRemoveNew={(idx) => {
          const arr = files.filter((_, i) => i !== idx);
          onFilesChange?.(record.name, arr);
        }}
        onDescNew={(idx, d) => {
          const arr = files.map((ff, i) => (i === idx ? { ...ff, description: d } : ff));
          onFilesChange?.(record.name, arr);
        }}
        showMime={false}
        showDetails
      />
    );
  }, [fileMap, onFilesChange]);

  // Мемоизируем рендер-функции для колонок
  const renderDescription = React.useCallback((field: any) => (
    <Form.Item
      name={[field.name, 'description']}
      noStyle
      rules={[{ required: true, message: 'Введите описание' }]}
    >
      <Input.TextArea 
        size="small" 
        autoSize={{ minRows: 1, maxRows: 4 }}
        placeholder="Описание" 
      />
    </Form.Item>
  ), []);

  const renderStatus = React.useCallback((field: any) => (
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
        options={defectStatusOptions}
      />
    </Form.Item>
  ), [defectStatuses, defectStatusOptions]);

  const renderType = React.useCallback((field: any) => (
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
        options={defectTypeOptions}
      />
    </Form.Item>
  ), [defectTypeOptions]);

  const renderWarranty = React.useCallback((field: any) => (
    <Form.Item name={[field.name, 'is_warranty']} valuePropName="checked" noStyle initialValue={false}>
      <Switch size="small" />
    </Form.Item>
  ), []);

  const renderReceivedDate = React.useCallback((field: any) => (
    <Space direction="vertical" size={2}>
      <Form.Item
        name={[field.name, 'received_at']}
        noStyle
        rules={[{ required: true, message: 'Укажите дату' }]}
        initialValue={defaultReceivedAt ?? dayjs()}
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
      </Space>
    </Space>
  ), [defaultReceivedAt, form]);

  const renderFixedDate = React.useCallback((field: any) => (
    <Form.Item
      name={[field.name, 'fixed_at']}
      noStyle
      rules={[{ required: true, message: 'Укажите дату' }]}
    >
      <DatePicker size="small" format="DD.MM.YYYY" style={{ width: '100%' }} />
    </Form.Item>
  ), []);

  const renderUpload = React.useCallback((field: any) => (
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
  ), [fileMap, onFilesChange]);

  const renderActions = React.useCallback((field: any) => (
    <Space>
      <Tooltip title="Файлы">
        <Button
          size="small"
          type="text"
          icon={<PaperClipOutlined />}
          onClick={() => setFileModalIdx(field.name)}
        />
      </Tooltip>
      <Tooltip title="Удалить">
        <Button
          size="small"
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => remove(field.name)}
        />
      </Tooltip>
    </Space>
  ), [remove]);

  // Мемоизируем рендер FixByField
  const renderFixByField = React.useCallback((field: any) => (
    <FixByField
      field={field}
      form={form}
      brigades={brigades}
      contractors={contractors}
    />
  ), [form, brigades, contractors]);

  const columns: ColumnsType<any> = useMemo(
    () =>
      [
      {
        title: '#',
        dataIndex: 'index',
        width: 40,
        render: (_: any, record: any, index: number) => {
          // Используем состояние текущей страницы
          const pageSize = 20;
          return (currentPage - 1) * pageSize + index + 1;
        },
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
        render: (_: any, field: any) => renderDescription(field),
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
        render: (_: any, field: any) => renderStatus(field),
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
        render: (_: any, field: any) => renderType(field),
      },
      {
        title: 'Гарантия',
        dataIndex: 'is_warranty',
        width: 100,
        render: (_: any, field: any) => renderWarranty(field),
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
        render: (_: any, field: any) => renderReceivedDate(field),
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
        render: (_: any, field: any) => renderFixedDate(field),
      },
      {
        title: 'Кем устраняется',
        dataIndex: 'executor',
        width: 180,
        ellipsis: true,
        render: (_: any, field: any) => renderFixByField(field),
      },
      showFiles
        ? {
            title: 'Файлы',
            dataIndex: 'files',
            width: 200,
            render: (_: any, field: any) => renderUpload(field),
          }
        : null,
      {
        title: '',
        dataIndex: 'actions',
        width: 80,
        render: (_: any, field: any) => renderActions(field),
      },
    ].filter(Boolean),
    [
      defectTypeOptions, 
      defectStatusOptions, 
      renderDescription,
      renderStatus,
      renderType,
      renderWarranty,
      renderReceivedDate,
      renderFixedDate,
      renderFixByField,
      renderUpload,
      renderActions,
      showFiles,
      currentPage
    ],
  );

  if (loadingTypes || loadingStatuses) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 500 }}>
          Дефекты ({fields.length})
          {fields.length > 20 && (
            <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
              • отображается по 20 на странице
            </span>
          )}
        </span>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddDefect}
        >
          Добавить дефект
        </Button>
      </div>
      <Table
        size="small"
        pagination={fields.length > 20 ? { 
          pageSize: 20, 
          size: 'small',
          showSizeChanger: false,
          showQuickJumper: false,
          current: currentPage,
          onChange: (page) => setCurrentPage(page)
        } : false}
        rowKey="key"
        columns={columns}
        dataSource={fields}
        expandable={{
          expandedRowKeys: expandedKeys,
          onExpand: handleExpand,
          expandIcon: renderExpandIcon,
          expandedRowRender: renderExpandedRow,
        }}
      />
      <DefectFilesModal
        open={fileModalIdx !== null}
        files={fileModalIdx !== null ? fileMap[fileModalIdx] ?? [] : []}
        onChange={(f) => fileModalIdx !== null && onFilesChange?.(fileModalIdx, f)}
        onClose={() => setFileModalIdx(null)}
      />
    </div>
  );
});

DefectEditableTable.displayName = 'DefectEditableTable';

export default DefectEditableTable;
