import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ConfigProvider,
  Typography,
  Form,
  Select,
  Input,
  Button,
  Card,
  DatePicker,
} from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import { AddLetterFormData } from '@/features/correspondence/AddLetterForm';
import AddLetterForm from '@/features/correspondence/AddLetterForm';
import LinkLettersDialog from '@/features/correspondence/LinkLettersDialog';
import EditLetterDialog from '@/features/correspondence/EditLetterDialog';
import ExportLettersButton from '@/features/correspondence/ExportLettersButton';
import CorrespondenceTable from '@/widgets/CorrespondenceTable';
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
  search?: string;
}

/** Страница учёта корреспонденции */
export default function CorrespondencePage() {
  const { data: letters = [] } = useLetters();
  const add = useAddLetter();
  const remove = useDeleteLetter();
  const linkLetters = useLinkLetters();
  const unlinkLetter = useUnlinkLetter();
  const notify = useNotify();
  const [filters, setFilters] = useState<Filters>({
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
    search: '',
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
  const [view, setView] = useState<CorrespondenceLetter | null>(null);
  const [linkFor, setLinkFor] = useState<CorrespondenceLetter | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const hideOnScroll = useRef(false);

  React.useEffect(() => {
    const id = searchParams.get('letter_id');
    if (id && letters.length) {
      const letter = letters.find((l) => String(l.id) === id);
      if (letter) setView(letter);
    }
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
      view?.project_id ?? (filters.project ? Number(filters.project) : null),
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
      search: values.search ?? '',
    });
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
      search: '',
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
        filters.search &&
        !(
            l.number.includes(filters.search) ||
            sender.includes(filters.search.toLowerCase()) ||
            receiver.includes(filters.search.toLowerCase()) ||
            subject.includes(filters.search.toLowerCase())
        )
    )
      return false;
    return true;
  });

  const total = letters.length;
  /** ID статуса "Закрыто", определяется по названию */
  const closedStatusId = React.useMemo(
    () => statuses.find((s) => /закры/i.test(s.name))?.id ?? null,
    [statuses],
  );
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
          style={{ marginTop: 16 }}
        >
          {showAddForm ? 'Скрыть форму' : 'Добавить письмо'}
        </Button>
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

        <div
          style={{ marginTop: 24 }}
          onWheel={() => {
            if (hideOnScroll.current) {
              setShowAddForm(false);
              hideOnScroll.current = false;
            }
          }}
        >
          <Card style={{ marginBottom: 24 }}>
            <Form
              form={form}
              layout="vertical"
              onValuesChange={handleFiltersChange}
              initialValues={filters}
              className="filter-grid"
            >
            <Form.Item name="period" label="Период">
              <DatePicker.RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="type" label="Тип письма">
              <Select allowClear placeholder="Все типы">
                <Select.Option value="incoming">Входящее</Select.Option>
                <Select.Option value="outgoing">Исходящее</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="id" label="ID">
              <Select mode="multiple" allowClear options={idOptions} placeholder="ID" />
            </Form.Item>

            <Form.Item name="category" label="Категория">
              <Select allowClear options={letterTypes.map((t) => ({ value: t.id, label: t.name }))} />
            </Form.Item>

            <Form.Item name="project" label="Проект">
              <Select
                  showSearch
                  allowClear
                  options={projects.map((p) => ({ value: p.id, label: p.name }))}
                  onChange={() => form.setFieldValue('unit', undefined)}
              />
            </Form.Item>

            <Form.Item name="unit" label="Объект">
              <Select
                  showSearch
                  allowClear
                  options={projectUnits.map((u) => ({ value: u.id, label: u.name }))}
                  disabled={!form.getFieldValue('project')}
              />
            </Form.Item>

            <Form.Item name="sender" label="Отправитель">
              <Select
                showSearch
                allowClear
                options={contactOptions}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>

            <Form.Item name="receiver" label="Получатель">
              <Select
                showSearch
                allowClear
                options={contactOptions}
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>

            <Form.Item name="subject" label="В теме">
              <Input allowClear autoComplete="off" />
            </Form.Item>

            <Form.Item name="content" label="В содержании">
              <Input allowClear autoComplete="off" />
            </Form.Item>

            <Form.Item name="status" label="Статус писем">
              <Select allowClear options={statuses.map((s) => ({ value: s.id, label: s.name }))} />
            </Form.Item>

            <Form.Item name="responsible" label="Ответственный">
              <Select
                showSearch
                allowClear
                options={users.map((u) => ({ value: u.id, label: u.name }))}
              />
            </Form.Item>

            <Form.Item name="search" label="Поиск">
              <Input allowClear autoComplete="off" />
            </Form.Item>
            <Form.Item>
              <Button onClick={resetFilters} block>
                Сбросить фильтры
              </Button>
            </Form.Item>
            </Form>
          </Card>
          <CorrespondenceTable
            letters={filtered}
            onView={setView}
            onDelete={handleDelete}
            onAddChild={setLinkFor}
            onUnlink={handleUnlink}
            users={users}
            letterTypes={letterTypes}
            projects={projects}
            units={allUnits}
            statuses={statuses}
          />
          <Typography.Text style={{ display: 'block', marginTop: 8 }}>
            Всего писем: {total}, из них закрытых: {closedCount} и не закрытых: {openCount}
          </Typography.Text>
          <Typography.Text style={{ display: 'block', marginTop: 4 }}>
            Готовых писем к выгрузке: {readyToExport}
          </Typography.Text>
          <div style={{ marginTop: 8 }}>
            <ExportLettersButton
              letters={filtered}
              users={users}
              letterTypes={letterTypes}
              projects={projects}
              units={allUnits}
              statuses={statuses}
            />
          </div>
        </div>

        <EditLetterDialog
            open={!!view}
            letter={view}
            onClose={() => setView(null)}
            projects={projects}
            letterTypes={letterTypes}
            attachmentTypes={attachmentTypes}
        />
      </>
    </ConfigProvider>
  );
}
