import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ConfigProvider,
  Typography,
  Form,
  Select,
  Input,
  Switch,
  Button,
  Card,
  DatePicker,
  Tooltip,
  Space,
  Popconfirm,
  Tag,
} from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import { AddLetterFormData } from '@/features/correspondence/AddLetterForm';
import AddLetterForm from '@/features/correspondence/AddLetterForm';
import LinkLettersDialog from '@/features/correspondence/LinkLettersDialog';
import ExportLettersButton from '@/features/correspondence/ExportLettersButton';
import CorrespondenceTable from '@/widgets/CorrespondenceTable';
import CorrespondenceFilters from '@/widgets/CorrespondenceFilters';
import TableColumnsDrawer from '@/widgets/TableColumnsDrawer';
import LetterStatusSelect from '@/features/correspondence/LetterStatusSelect';
import LetterViewModal from '@/features/correspondence/LetterViewModal';
import type { TableColumnSetting } from '@/shared/types/tableColumnSetting';
import type { ColumnsType } from 'antd/es/table';
import {
  useLetters,
  useAddLetter,
  useDeleteLetter,
  useLinkLetters,
  useUnlinkLetter,
} from '@/entities/correspondence';
import { CorrespondenceLetter } from '@/shared/types/correspondence';
import { fixForeignKeys } from '@/shared/utils/fixForeignKeys';

import { useUsers } from '@/entities/user';
import { useLetterTypes } from '@/entities/letterType';
import { useProjects } from '@/entities/project';
import { useUnitsByProject, useUnitsByIds } from '@/entities/unit';
import { useAttachmentTypes } from '@/entities/attachmentType';
import { useNotify } from '@/shared/hooks/useNotify';
import { useLetterStatuses } from '@/entities/letterStatus';
import { useContractors } from '@/entities/contractor';
import { usePersons } from '@/entities/person';
import {
  SettingOutlined,
  DeleteOutlined,
  PlusOutlined,
  MailOutlined,
  BranchesOutlined,
  LinkOutlined,
} from '@ant-design/icons';

interface Filters {
  period?: [dayjs.Dayjs, dayjs.Dayjs] | null;
  type?: 'incoming' | 'outgoing' | '';
  id?: number[];
  category?: number | '';
  project?: number | '';
  unit?: number | '';
  sender?: string;
  receiver?: string;
  subject?: string;
  content?: string;
  status?: number | '';
  responsible?: string | '';
  hideClosed?: boolean;
}

const LS_HIDE_CLOSED_KEY = 'correspondenceHideClosed';

/** Страница учёта корреспонденции */
export default function CorrespondencePage() {
  const { data: letters = [] } = useLetters();
  const add = useAddLetter();
  const remove = useDeleteLetter();
  const linkLetters = useLinkLetters();
  const unlinkLetter = useUnlinkLetter();
  const notify = useNotify();
  const [filters, setFilters] = useState<Filters>(() => {
    let hideClosed = false;
    try {
      const saved = localStorage.getItem(LS_HIDE_CLOSED_KEY);
      hideClosed = saved ? JSON.parse(saved) : false;
    } catch {}
    return {
      period: null,
      type: '',
      id: [],
      category: '',
      project: '',
      unit: '',
      sender: '',
      receiver: '',
      subject: '',
      content: '',
      status: '',
      responsible: '',
      hideClosed,
    };
  });
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const initialValues = {
    project_id: searchParams.get('project_id')
      ? Number(searchParams.get('project_id')!)
      : undefined,
    unit_ids: searchParams.get('unit_id')
      ? [Number(searchParams.get('unit_id')!)]
      : [],
    responsible_user_id: searchParams.get('responsible_user_id') || undefined,
  };
  const [linkFor, setLinkFor] = useState<CorrespondenceLetter | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const hideOnScroll = useRef(false);
  const LS_FILTERS_VISIBLE_KEY = 'correspondenceFiltersVisible';
  const LS_COLUMNS_KEY = 'correspondenceColumns';
  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_FILTERS_VISIBLE_KEY);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);

  React.useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === LS_FILTERS_VISIBLE_KEY) {
        try {
          setShowFilters(JSON.parse(e.newValue || 'true'));
        } catch {}
      }
      if (e.key === LS_HIDE_CLOSED_KEY) {
        try {
          setFilters((f) => ({ ...f, hideClosed: JSON.parse(e.newValue || 'false') }));
          form.setFieldValue('hideClosed', JSON.parse(e.newValue || 'false'));
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [form]);

  React.useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      const arr = ids
        .split(',')
        .map((v) => Number(v))
        .filter(Boolean);
      const valid = arr.filter((lid) => letters.some((l) => Number(l.id) === lid));
      setFilters((f) => ({ ...f, id: valid }));
      form.setFieldValue('id', valid);
    }
  }, [searchParams, letters]);


  const { data: users = [] } = useUsers();
  const { data: letterTypes = [] } = useLetterTypes();
  const { data: statuses = [] } = useLetterStatuses();
  const { data: contractors = [] } = useContractors();
  const { data: persons = [] } = usePersons();
  const { data: projects = [] } = useProjects();
  const { data: attachmentTypes = [] } = useAttachmentTypes();
  const { data: projectUnits = [] } = useUnitsByProject(
    filters.project ? Number(filters.project) : null,
  );

  const unitIds = React.useMemo(
      () => Array.from(new Set(letters.flatMap((l) => l.unit_ids))),
      [letters],
  );
  const { data: allUnits = [] } = useUnitsByIds(unitIds);

  const contactOptions = React.useMemo(
    () => [
      ...contractors.map((c) => ({ value: c.name, label: c.name })),
      ...persons.map((p) => ({ value: p.full_name, label: p.full_name })),
    ],
    [contractors, persons],
  );

  const idOptions = React.useMemo(
    () => letters.map((l) => ({ value: l.id, label: String(l.id) })),
    [letters],
  );

  const handleFiltersChange = (_: any, values: any) => {
    setFilters({
      period: values.period ?? null,
      type: values.type ?? '',
      id: values.id ?? [],
      category: values.category ?? '',
      project: values.project ?? '',
      unit: values.unit ?? '',
      sender: values.sender ?? '',
      receiver: values.receiver ?? '',
      subject: values.subject ?? '',
      content: values.content ?? '',
      status: values.status ?? '',
      responsible: values.responsible ?? '',
      hideClosed: values.hideClosed ?? false,
    });
    if (Object.prototype.hasOwnProperty.call(values, 'hideClosed')) {
      try {
        localStorage.setItem(LS_HIDE_CLOSED_KEY, JSON.stringify(values.hideClosed));
      } catch {}
    }
  };

  const resetFilters = () => {
    form.resetFields();
    setFilters({
      period: null,
      type: '',
      id: [],
      category: '',
      project: '',
      unit: '',
      sender: '',
      receiver: '',
      subject: '',
      content: '',
      status: '',
      responsible: '',
      hideClosed: filters.hideClosed,
    });
  };

  const handleAdd = (data: AddLetterFormData) => {
    // 'case_id' удалён из всех списков FK!
    const safeData = fixForeignKeys(
      {
        ...data,
        // явное приведение undefined/'' к null для корректного сохранения FK
        responsible_user_id: data.responsible_user_id || null,
        date: data.date ? data.date.toISOString() : dayjs().toISOString(),
      },
      ['responsible_user_id', 'letter_type_id', 'project_id', 'status_id'],
    );

    add.mutate(safeData, {
      onSuccess: () => {
        notify.success('Письмо добавлено');
        hideOnScroll.current = true;
      },
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Удалить письмо?')) return;
    remove.mutate(id, {
      onSuccess: () => notify.success('Письмо удалено'),
    });
  };

  const handleUnlink = (id: string) => {
    unlinkLetter.mutate(id, {
      onSuccess: () => notify.success('Письмо исключено из связи'),
    });
  };

  const getBaseColumns = () => {
    return {
      treeIcon: {
        title: '',
        dataIndex: 'treeIcon',
        width: 40,
        render: (_: any, record: any) => {
          if (!record.parent_id) {
            return (
              <Tooltip title="Главное письмо">
                <MailOutlined style={{ color: '#1890ff', fontSize: 17 }} />
              </Tooltip>
            );
          }
          return (
            <Tooltip title="Связанное письмо">
              <BranchesOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            </Tooltip>
          );
        },
      },
      id: { title: 'ID', dataIndex: 'id', width: 80 },
      type: {
        title: 'Тип',
        dataIndex: 'type',
        width: 100,
        sorter: (a: any, b: any) => a.type.localeCompare(b.type),
        render: (v: string) => (
          <Tag color={v === 'incoming' ? 'success' : 'processing'}>
            {v === 'incoming' ? 'Входящее' : 'Исходящее'}
          </Tag>
        ),
      },
      number: {
        title: 'Номер',
        dataIndex: 'number',
        width: 120,
        sorter: (a: any, b: any) => a.number.localeCompare(b.number),
        render: (num: string, record: any) => (
          <b style={!record.parent_id ? { fontWeight: 600 } : {}}>{num}</b>
        ),
      },
      date: {
        title: 'Дата',
        dataIndex: 'date',
        width: 120,
        sorter: (a: any, b: any) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
        render: (v: string) => dayjs(v).format('DD.MM.YYYY'),
      },
      sender: {
        title: 'Отправитель',
        dataIndex: 'sender',
        sorter: (a: any, b: any) => (a.sender || '').localeCompare(b.sender || ''),
        render: (val: string, record: any) => (
          <span style={record.parent_id ? { color: '#888' } : {}}>{val}</span>
        ),
      },
      receiver: {
        title: 'Получатель',
        dataIndex: 'receiver',
        sorter: (a: any, b: any) => (a.receiver || '').localeCompare(b.receiver || ''),
        render: (val: string, record: any) => (
          <span style={record.parent_id ? { color: '#888' } : {}}>{val}</span>
        ),
      },
      subject: {
        title: 'Тема',
        dataIndex: 'subject',
        sorter: (a: any, b: any) => a.subject.localeCompare(b.subject),
        render: (val: string, record: any) => (
          <span style={record.parent_id ? { color: '#888' } : {}}>{val}</span>
        ),
      },
      projectName: {
        title: 'Проект',
        dataIndex: 'projectName',
        sorter: (a: any, b: any) => (a.projectName || '').localeCompare(b.projectName || ''),
      },
      unitNames: {
        title: 'Объекты',
        dataIndex: 'unitNames',
        sorter: (a: any, b: any) => (a.unitNames || '').localeCompare(b.unitNames || ''),
      },
      letterTypeName: {
        title: 'Категория',
        dataIndex: 'letterTypeName',
        sorter: (a: any, b: any) => (a.letterTypeName || '').localeCompare(b.letterTypeName || ''),
      },
      statusName: {
        title: 'Статус',
        dataIndex: 'statusName',
        sorter: (a: any, b: any) => (a.statusName || '').localeCompare(b.statusName || ''),
        render: (_: any, row: any) => (
          <LetterStatusSelect letterId={row.id} statusId={row.status_id} statusName={row.statusName} />
        ),
      },
      responsibleName: {
        title: 'Ответственный',
        dataIndex: 'responsibleName',
        sorter: (a: any, b: any) => (a.responsibleName || '').localeCompare(b.responsibleName || ''),
        render: (name: string) => name || '—',
      },
      actions: {
        title: 'Действия',
        key: 'actions',
        width: 150,
        render: (_: any, record: CorrespondenceLetter) => (
          <Space size="middle">
            <Tooltip title="Просмотр">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => setViewId(String(record.id))}
              />
            </Tooltip>
            <Button type="text" icon={<PlusOutlined />} onClick={() => setLinkFor(record)} />
            {record.parent_id && (
              <Tooltip title="Исключить из связи">
                <Button
                  type="text"
                  icon={<LinkOutlined style={{ color: '#c41d7f', textDecoration: 'line-through', fontWeight: 700 }} />}
                  onClick={() => handleUnlink(record.id)}
                />
              </Tooltip>
            )}
            <Popconfirm title="Удалить письмо?" okText="Да" cancelText="Нет" onConfirm={() => handleDelete(record.id)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    } as Record<string, ColumnsType<any>[number]>;
  };

  const [columnsState, setColumnsState] = useState<TableColumnSetting[]>(() => {
    const base = getBaseColumns();
    const defaults = Object.keys(base).map((key) => ({ key, title: base[key].title as string, visible: true }));
    try {
      const saved = localStorage.getItem(LS_COLUMNS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TableColumnSetting[];
        return parsed.filter((c) => base[c.key]);
      }
    } catch {}
    return defaults;
  });

  /**
   * Сброс колонок к начальному состоянию
   */
  const handleResetColumns = () => {
    const base = getBaseColumns();
    const defaults = Object.keys(base).map((key) => ({
      key,
      title: base[key].title as string,
      visible: true,
    }));
    setColumnsState(defaults);
  };

  React.useEffect(() => {
    try {
      localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(columnsState));
    } catch {}
  }, [columnsState]);

  React.useEffect(() => {
    try {
      localStorage.setItem(LS_FILTERS_VISIBLE_KEY, JSON.stringify(showFilters));
    } catch {}
  }, [showFilters]);

  const baseColumns = React.useMemo(getBaseColumns, [remove.isPending]);
  const columns: ColumnsType<any> = React.useMemo(
    () => columnsState.filter((c) => c.visible).map((c) => baseColumns[c.key]),
    [columnsState, baseColumns],
  );

  /** ID статуса "Закрыто", определяется по названию */
  const closedStatusId = React.useMemo(
    () => statuses.find((s) => /закры/i.test(s.name))?.id ?? null,
    [statuses],
  );

  const filtered = letters.filter((l) => {
    if (filters.period && filters.period.length === 2) {
      const [from, to] = filters.period;
      const d = dayjs(l.date);
      if (d.isBefore(from, 'day') || d.isAfter(to, 'day')) return false;
    }
    if (filters.type && l.type !== filters.type) return false;
    if (filters.category && l.letter_type_id !== Number(filters.category)) return false;
    if (filters.project && l.project_id !== Number(filters.project)) return false;
    if (filters.unit && !l.unit_ids.includes(Number(filters.unit))) return false;
    if (filters.id && filters.id.length) {
      const ids = filters.id.map(String);
      if (!ids.includes(String(l.id))) return false;
    }
    if (filters.status && l.status_id !== Number(filters.status)) return false;
    if (filters.responsible && String(l.responsible_user_id) !== filters.responsible) return false;
    const sender = (l.sender || '').toLowerCase();
    const receiver = (l.receiver || '').toLowerCase();
    const subject = (l.subject || '').toLowerCase();
    const content = (l.content || '').toLowerCase();

    if (filters.sender && !sender.includes(filters.sender.toLowerCase()))
      return false;
    if (filters.receiver && !receiver.includes(filters.receiver.toLowerCase()))
      return false;
    if (
        filters.subject &&
        !subject.includes(filters.subject.toLowerCase())
    )
      return false;
    if (
        filters.content &&
        !content.includes(filters.content.toLowerCase())
    )
      return false;
    if (
        filters.hideClosed &&
        closedStatusId != null &&
        l.status_id === closedStatusId
    )
      return false;
    return true;
  });

  const total = letters.length;
  /** Количество закрытых писем */
  const closedCount = React.useMemo(
    () => letters.filter((l) => closedStatusId != null && l.status_id === closedStatusId).length,
    [letters, closedStatusId],
  );
  /** Количество не закрытых писем */
  const openCount = total - closedCount;
  /** Сколько писем пройдёт в выгрузку с учётом фильтров */
  const readyToExport = filtered.length;

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <Button
          type="primary"
          onClick={() => setShowAddForm((p) => !p)}
          style={{ marginTop: 16, marginRight: 8 }}
        >
          {showAddForm ? 'Скрыть форму' : 'Добавить письмо'}
        </Button>
        <Button onClick={() => setShowFilters((p) => !p)} style={{ marginTop: 16 }}>
          {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
        </Button>
        <Button
          icon={<SettingOutlined />}
          style={{ marginTop: 16, marginLeft: 8 }}
          onClick={() => setShowColumnsDrawer(true)}
        />
        <span style={{ marginTop: 16, marginLeft: 8, display: 'inline-block' }}>
          <ExportLettersButton
            letters={filtered}
            users={users}
            letterTypes={letterTypes}
            projects={projects}
            units={allUnits}
            statuses={statuses}
          />
        </span>
        {showAddForm && (
          <div style={{ marginTop: 16 }}>
            <AddLetterForm onSubmit={handleAdd} initialValues={initialValues} />
          </div>
        )}

        <LinkLettersDialog
          open={!!linkFor}
          parent={linkFor}
          letters={letters}
          onClose={() => setLinkFor(null)}
          onSubmit={(ids) => {
            if (!linkFor) return;
            linkLetters.mutate({ parentId: linkFor.id, childIds: ids }, {
              onSuccess: () => {
                notify.success('Письма связаны');
                setLinkFor(null);
              },
            });
          }}
        />
        <TableColumnsDrawer
          open={showColumnsDrawer}
          columns={columnsState}
          onChange={setColumnsState}
          onClose={() => setShowColumnsDrawer(false)}
          onReset={handleResetColumns}
        />

        <div
          style={{ marginTop: 24 }}
          onWheel={() => {
            if (hideOnScroll.current) {
              setShowAddForm(false);
              hideOnScroll.current = false;
            }
          }}
        >
          {showFilters && (
            <Card style={{ marginBottom: 24 }}>
              <CorrespondenceFilters
                form={form}
                filters={filters}
                onChange={handleFiltersChange}
                users={users.map((u) => ({ value: u.id, label: u.name }))}
                letterTypes={letterTypes.map((t) => ({ value: t.id, label: t.name }))}
                projects={projects.map((p) => ({ value: p.id, label: p.name }))}
                projectUnits={projectUnits.map((u) => ({ value: u.id, label: u.name }))}
                contactOptions={contactOptions}
                statuses={statuses.map((s) => ({ value: s.id, label: s.name }))}
                idOptions={idOptions}
                onReset={resetFilters}
              />
            </Card>
          )}
          <CorrespondenceTable
            letters={filtered}
            onDelete={handleDelete}
            onAddChild={setLinkFor}
            onUnlink={handleUnlink}
            onView={(id) => setViewId(String(id))}
            users={users}
            letterTypes={letterTypes}
            projects={projects}
            units={allUnits}
            statuses={statuses}
            columns={columns}
          />
          <Typography.Text style={{ display: 'block', marginTop: 8 }}>
            Всего писем: {total}, из них закрытых: {closedCount} и не закрытых: {openCount}
          </Typography.Text>
          <Typography.Text style={{ display: 'block', marginTop: 4 }}>
            Готовых писем к выгрузке: {readyToExport}
          </Typography.Text>
        </div>
        <LetterViewModal open={viewId !== null} letterId={viewId} onClose={() => setViewId(null)} />
      </>
    </ConfigProvider>
  );
}
