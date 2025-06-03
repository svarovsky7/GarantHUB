import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ConfigProvider,
  Typography,
  Form,
  Select,
  Input,
  Button,
  message,
} from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import { AddLetterFormData } from '@/features/correspondence/AddLetterForm';
import AddLetterForm from '@/features/correspondence/AddLetterForm';
import LinkLettersDialog from '@/features/correspondence/LinkLettersDialog';
import EditLetterDialog from '@/features/correspondence/EditLetterDialog';
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

interface Filters {
  type?: 'incoming' | 'outgoing' | '';
  project?: number | '';
  unit?: number | '';
  sender?: string;
  receiver?: string;
  subject?: string;
  content?: string;
  search?: string;
}

/** Страница учёта корреспонденции */
export default function CorrespondencePage() {
  const { data: letters = [] } = useLetters();
  const add = useAddLetter();
  const remove = useDeleteLetter();
  const linkLetters = useLinkLetters();
  const unlinkLetter = useUnlinkLetter();
  const [filters, setFilters] = useState<Filters>({
    type: '',
    project: '',
    unit: '',
    sender: '',
    receiver: '',
    subject: '',
    content: '',
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

  const { data: users = [] } = useUsers();
  const { data: letterTypes = [] } = useLetterTypes();
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

  const handleFiltersChange = (_: any, values: any) => {
    setFilters({
      type: values.type ?? '',
      project: values.project ?? '',
      unit: values.unit ?? '',
      sender: values.sender ?? '',
      receiver: values.receiver ?? '',
      subject: values.subject ?? '',
      content: values.content ?? '',
      search: values.search ?? '',
    });
  };

  const resetFilters = () => {
    form.resetFields();
    setFilters({
      type: '',
      project: '',
      unit: '',
      sender: '',
      receiver: '',
      subject: '',
      content: '',
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
      ['responsible_user_id', 'letter_type_id', 'project_id'],
    );

    add.mutate(safeData, {
      onSuccess: () => {
        message.success('Письмо добавлено');
      },
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Удалить письмо?')) return;
    remove.mutate(id, {
      onSuccess: () => message.success('Письмо удалено'),
    });
  };

  const handleUnlink = (id: string) => {
    unlinkLetter.mutate(id, {
      onSuccess: () => message.success('Письмо исключено из связи'),
    });
  };

  const filtered = letters.filter((l) => {
    if (filters.type && l.type !== filters.type) return false;
    if (filters.project && l.project_id !== Number(filters.project)) return false;
    if (filters.unit && !l.unit_ids.includes(Number(filters.unit))) return false;
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

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <div style={{ marginTop: 16 }}>
          <AddLetterForm onSubmit={handleAdd} initialValues={initialValues} />
        </div>

        <LinkLettersDialog
          open={!!linkFor}
          parent={linkFor}
          letters={letters}
          onClose={() => setLinkFor(null)}
          onSubmit={(ids) => {
            if (!linkFor) return;
            linkLetters.mutate({ parentId: linkFor.id, childIds: ids }, {
              onSuccess: () => {
                message.success('Письма связаны');
                setLinkFor(null);
              },
            });
          }}
        />

        <div style={{ marginTop: 24 }}>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleFiltersChange}
            initialValues={filters}
            className="filter-grid"
            style={{ marginBottom: 16 }}
          >
            <Form.Item name="type" label="Тип письма">
              <Select allowClear placeholder="Все типы">
                <Select.Option value="incoming">Входящее</Select.Option>
                <Select.Option value="outgoing">Исходящее</Select.Option>
              </Select>
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
              <Input allowClear autoComplete="off" />
            </Form.Item>
            <Form.Item name="receiver" label="Получатель">
              <Input allowClear autoComplete="off" />
            </Form.Item>
            <Form.Item name="subject" label="В теме">
              <Input allowClear autoComplete="off" />
            </Form.Item>
            <Form.Item name="content" label="В содержании">
              <Input allowClear autoComplete="off" />
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
          />
          <Typography.Text style={{ display: 'block', marginTop: 8 }}>
            Всего писем: {total}
          </Typography.Text>
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
