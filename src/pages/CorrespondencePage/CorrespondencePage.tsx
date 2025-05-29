import React, { useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Button as MuiButton,
} from '@mui/material';
import { Form, Select, Input, Button } from 'antd';
import dayjs from 'dayjs';
import { AddLetterFormData } from '@/features/correspondence/AddLetterForm';
import AddLetterForm from '@/features/correspondence/AddLetterForm';
import LinkLettersDialog from '@/features/correspondence/LinkLettersDialog';
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
  correspondent?: string;
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
    correspondent: '',
    subject: '',
    content: '',
    search: '',
  });
  const [form] = Form.useForm();
  const [view, setView] = useState<CorrespondenceLetter | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
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
      correspondent: values.correspondent ?? '',
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
      correspondent: '',
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
          date: data.date ? data.date.toISOString() : dayjs().toISOString(),
        },
        [
          'responsible_user_id',
          'letter_type_id',
          'project_id',
        ]
    );

    add.mutate(safeData, {
      onSuccess: () => {
        setSnackbar('Письмо добавлено');
      },
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Удалить письмо?')) return;
    remove.mutate(id, {
      onSuccess: () => setSnackbar('Письмо удалено'),
    });
  };

  const handleUnlink = (id: string) => {
    unlinkLetter.mutate(id, {
      onSuccess: () => setSnackbar('Письмо исключено из связи'),
    });
  };

  const filtered = letters.filter((l) => {
    if (filters.type && l.type !== filters.type) return false;
    if (filters.project && l.project_id !== Number(filters.project)) return false;
    if (filters.unit && !l.unit_ids.includes(Number(filters.unit))) return false;
    const correspondent = (l.correspondent || '').toLowerCase();
    const subject = (l.subject || '').toLowerCase();
    const content = (l.content || '').toLowerCase();

    if (
        filters.correspondent &&
        !correspondent.includes(filters.correspondent.toLowerCase())
    )
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
            correspondent.includes(filters.search.toLowerCase()) ||
            subject.includes(filters.search.toLowerCase())
        )
    )
      return false;
    return true;
  });

  const total = letters.length;

  return (
      <Stack spacing={3} sx={{ mt: 2 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Система учета корреспонденции
          </Typography>
          <Typography>Управление входящими и исходящими письмами</Typography>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <AddLetterForm onSubmit={handleAdd} />
        </Paper>

        <LinkLettersDialog
            open={!!linkFor}
            parent={linkFor}
            letters={letters}
            onClose={() => setLinkFor(null)}
            onSubmit={(ids) => {
              if (!linkFor) return;
              linkLetters.mutate({ parentId: linkFor.id, childIds: ids }, {
                onSuccess: () => {
                  setSnackbar('Письма связаны');
                  setLinkFor(null);
                },
              });
            }}
        />

        <Paper sx={{ p: 2 }}>
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
            <Form.Item name="correspondent" label="Корреспондент">
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2">Всего писем: {total}</Typography>
          </Box>
        </Paper>

        <Dialog open={!!view} onClose={() => setView(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Детали письма</DialogTitle>
          {view && (
              <DialogContent dividers>
                <Typography variant="subtitle2" gutterBottom>
                  {view.type === 'incoming' ? 'Входящее' : 'Исходящее'} письмо №{' '}
                  {view.number}
                </Typography>
                <Typography gutterBottom>
                  Дата: {dayjs(view.date).format('DD.MM.YYYY')}
                </Typography>
                {view.project_id && (
                    <Typography gutterBottom>
                      Проект: {projects.find((p) => p.id === view.project_id)?.name}
                    </Typography>
                )}
                {view.unit_ids.length > 0 && (
                    <Typography gutterBottom>
                      Объекты:{' '}
                      {view.unit_ids
                          .map((id) => projectUnits.find((u) => u.id === id)?.name)
                          .filter(Boolean)
                          .join(', ')}
                    </Typography>
                )}
                {view.letter_type_id && (
                    <Typography gutterBottom>
                      Категория: {letterTypes.find((t) => t.id === view.letter_type_id)?.name}
                    </Typography>
                )}
                {view.responsible_user_id && (
                    <Typography gutterBottom>
                      Ответственный: {users.find((u) => u.id === view.responsible_user_id)?.name}
                    </Typography>
                )}

                <Typography gutterBottom>Корреспондент: {view.correspondent}</Typography>
                <Typography gutterBottom>Тема: {view.subject}</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{view.content}</Typography>
                {view.attachments.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Вложения:
                      </Typography>
                      {view.attachments.map((a) => (
                          <div key={a.id} style={{ marginBottom: 4 }}>
                            <a href={a.file_url} download={a.name} style={{ marginRight: 8 }}>
                              {a.name}
                            </a>
                            {a.attachment_type_id && (
                                <Typography component="span" variant="body2" color="text.secondary">
                                  (
                                  {attachmentTypes.find((t) => t.id === a.attachment_type_id)?.name ||
                                      'Тип не указан'}
                                  )
                                </Typography>
                            )}
                          </div>
                      ))}
                    </Box>
                )}
              </DialogContent>
          )}
          <DialogActions>
            <MuiButton onClick={() => setView(null)}>Закрыть</MuiButton>
          </DialogActions>
        </Dialog>

        <Snackbar
            open={!!snackbar}
            autoHideDuration={3000}
            onClose={() => setSnackbar(null)}
            message={snackbar}
        />
      </Stack>
  );
}
