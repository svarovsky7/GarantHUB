import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ConfigProvider,
  Typography,
  Form,
  Button,
  Card,
  Tooltip,
  Space,
  Popconfirm,
  Alert,
  message,
} from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import { AddLetterFormData } from '@/features/correspondence/AddLetterForm';
import AddLetterForm from '@/features/correspondence/AddLetterForm';
import LinkLettersDialog from '@/features/correspondence/LinkLettersDialog';
import ExportLettersButton from '@/features/correspondence/ExportLettersButton';
import CorrespondenceTable from '@/widgets/CorrespondenceTable';
import CorrespondenceFilters from '@/widgets/CorrespondenceFilters';
import LetterViewModal from '@/features/correspondence/LetterViewModal';
import type { TableColumnSetting } from '@/shared/types/tableColumnSetting';
import {
  useAddLetter,
  useDeleteLetter,
  useLinkLetters,
  useUnlinkLetter,
} from '@/entities/correspondence';
import { CorrespondenceLetter } from '@/shared/types/correspondence';
import { fixForeignKeys } from '@/shared/utils/fixForeignKeys';
import { useAuthStore } from '@/shared/store/authStore';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useOptimizedLetters } from '@/shared/hooks/useOptimizedQueries';
import { useUsers } from '@/entities/user';
import { useLetterTypes } from '@/entities/letterType';
import { useVisibleProjects } from '@/entities/project';
import { useLockedUnitIds } from '@/entities/unit';
import { useNotify } from '@/shared/hooks/useNotify';
import { useLetterStatuses } from '@/entities/letterStatus';
import { useContractors } from '@/entities/contractor';
import { usePersons } from '@/entities/person';
import { useRolePermission } from '@/entities/rolePermission';
import type { RoleName } from '@/shared/types/rolePermission';
import {
  SettingOutlined,
  DeleteOutlined,
  PlusOutlined,
  MailOutlined,
  BranchesOutlined,
  LinkOutlined,
  EyeOutlined,
} from '@ant-design/icons';

const TableColumnsDrawer = React.lazy(
  () => import('@/widgets/TableColumnsDrawer'),
);

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
const LS_FILTERS_VISIBLE_KEY = 'correspondenceFiltersVisible';
const LS_COLUMNS_KEY = 'correspondenceColumns';
const LS_COLUMN_WIDTHS_KEY = 'correspondenceColumnWidths';

/** Оптимизированная страница учёта корреспонденции */
export default function OptimizedCorrespondencePage() {
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const projectId = useProjectId();
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
    } as Filters;
  });

  // Используем оптимизированные запросы
  const { 
    data: letters = [], 
    isPending: lettersLoading, 
    error 
  } = useOptimizedLetters(projectId || 1, filters);

  const add = useAddLetter();
  const remove = useDeleteLetter();
  const linkLetters = useLinkLetters();
  const unlinkLetter = useUnlinkLetter();
  const userId = useAuthStore((s) => s.profile?.id);
  const notify = useNotify();
  const [searchParams, setSearchParams] = useSearchParams();
  
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
  const hideOnScroll = useRef(false);
  
  // Показываем форму автоматически, если передан параметр ?open_form=1
  React.useEffect(() => {
    if (searchParams.get('open_form') === '1') {
      setShowAddForm(true);
    }
  }, [searchParams]);
  
  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_FILTERS_VISIBLE_KEY);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);

  // Ленивая загрузка данных
  const { data: users = [] } = useUsers();
  const { data: letterTypes = [] } = useLetterTypes();
  const { data: projects = [] } = useVisibleProjects();
  const { data: lockedUnitIds = [] } = useLockedUnitIds();
  const { data: letterStatuses = [] } = useLetterStatuses();
  const { data: contractors = [] } = useContractors();
  const { data: persons = [] } = usePersons();

  // Мемоизированные мапы для производительности
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      map.set(u.id, u.name);
    });
    return map;
  }, [users]);

  const letterTypeMap = useMemo(() => {
    const map = new Map<number, string>();
    letterTypes.forEach((lt) => {
      map.set(lt.id, lt.name);
    });
    return map;
  }, [letterTypes]);

  const projectMap = useMemo(() => {
    const map = new Map<number, string>();
    projects.forEach((p) => {
      map.set(p.id, p.name);
    });
    return map;
  }, [projects]);

  const letterStatusMap = useMemo(() => {
    const map = new Map<number, { name: string; color: string | null }>();
    letterStatuses.forEach((ls) => {
      map.set(ls.id, { name: ls.name, color: ls.color });
    });
    return map;
  }, [letterStatuses]);

  const contractorMap = useMemo(() => {
    const map = new Map<number, string>();
    contractors.forEach((c) => {
      map.set(c.id, c.name);
    });
    return map;
  }, [contractors]);

  const personMap = useMemo(() => {
    const map = new Map<number, string>();
    persons.forEach((p) => {
      map.set(p.id, p.full_name);
    });
    return map;
  }, [persons]);

  // Обработанные данные писем с именами (используем оптимизированные данные)
  const lettersWithNames = useMemo(() => {
    return letters.map((letter: any) => ({
      ...letter,
      projectName: letter.project_name || projectMap.get(letter.project_id) || '',
      unitNames: letter.unit_names || '',
      buildingNames: letter.building_names || '',
      letterTypeName: letter.letter_type_name || letterTypeMap.get(letter.letter_type_id) || '',
      statusName: letter.status_name || letterStatusMap.get(letter.status_id)?.name || '',
      statusColor: letter.status_color || letterStatusMap.get(letter.status_id)?.color || null,
      responsibleUserName: letter.responsible_user_name || userMap.get(letter.responsible_user_id) || '',
      createdByName: letter.created_by_name || userMap.get(letter.created_by) || '',
      senderName: letter.sender_name || 
        (letter.sender_person_id ? personMap.get(letter.sender_person_id) : '') ||
        (letter.sender_contractor_id ? contractorMap.get(letter.sender_contractor_id) : '') || '',
      receiverName: letter.receiver_name || 
        (letter.receiver_person_id ? personMap.get(letter.receiver_person_id) : '') ||
        (letter.receiver_contractor_id ? contractorMap.get(letter.receiver_contractor_id) : '') || '',
    }));
  }, [letters, userMap, letterTypeMap, projectMap, letterStatusMap, contractorMap, personMap]);

  // Фильтрация данных по проектам пользователя
  const userProjectIds = useAuthStore((s) => s.profile?.project_ids) ?? [];
  const filteredLetters = useMemo(() => {
    if (perm?.only_assigned_project) {
      return lettersWithNames.filter((letter) => 
        userProjectIds.includes(letter.project_id)
      );
    }
    return lettersWithNames;
  }, [lettersWithNames, perm?.only_assigned_project, userProjectIds]);

  // Обработчики
  const handleAddLetter = useCallback(async (data: AddLetterFormData) => {
    try {
      const fixed = fixForeignKeys(data);
      await add.mutateAsync(fixed);
      notify('Письмо добавлено', 'success');
      setShowAddForm(false);
      form.resetFields();
    } catch (error: any) {
      notify('Ошибка при добавлении письма: ' + error.message, 'error');
    }
  }, [add, notify, form]);

  const handleDeleteLetter = useCallback(async (letterId: number) => {
    try {
      await remove.mutateAsync({ id: letterId });
      notify('Письмо удалено', 'success');
    } catch (error: any) {
      notify('Ошибка при удалении письма: ' + error.message, 'error');
    }
  }, [remove, notify]);

  const handleLinkLetters = useCallback(async (parentId: string, childIds: string[]) => {
    try {
      await linkLetters.mutateAsync({ parentId, childIds });
      notify('Письма связаны', 'success');
      setLinkFor(null);
    } catch (error: any) {
      notify('Ошибка при связывании писем: ' + error.message, 'error');
    }
  }, [linkLetters, notify]);

  const handleUnlinkLetter = useCallback(async (letterId: number) => {
    try {
      await unlinkLetter.mutateAsync(letterId);
      notify('Связь удалена', 'success');
    } catch (error: any) {
      notify('Ошибка при удалении связи: ' + error.message, 'error');
    }
  }, [unlinkLetter, notify]);

  const handleToggleFilters = useCallback(() => {
    const newValue = !showFilters;
    setShowFilters(newValue);
    try {
      localStorage.setItem(LS_FILTERS_VISIBLE_KEY, JSON.stringify(newValue));
    } catch {}
  }, [showFilters]);

  const handleFiltersSubmit = useCallback((values: Filters) => {
    setFilters(values);
    if (values.hideClosed !== undefined) {
      try {
        localStorage.setItem(LS_HIDE_CLOSED_KEY, JSON.stringify(values.hideClosed));
      } catch {}
    }
    message.success(`Фильтры применены (${filteredLetters.length} результатов)`);
  }, [filteredLetters.length]);

  const handleFiltersReset = useCallback(() => {
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
      hideClosed: false,
    });
    try {
      localStorage.setItem(LS_HIDE_CLOSED_KEY, 'false');
    } catch {}
    message.info('Фильтры сброшены');
  }, []);

  // Статистика
  const statistics = useMemo(() => {
    const total = filteredLetters.length;
    const closedStatuses = letterStatuses.filter((s) => /закры|завер/i.test(s.name));
    const closedStatusIds = closedStatuses.map((s) => s.id);
    const closed = filteredLetters.filter((l) => closedStatusIds.includes(l.status_id)).length;
    const open = total - closed;
    const incoming = filteredLetters.filter((l) => l.direction === 'incoming').length;
    const outgoing = filteredLetters.filter((l) => l.direction === 'outgoing').length;
    return { total, closed, open, incoming, outgoing };
  }, [filteredLetters, letterStatuses]);

  return (
    <ConfigProvider locale={ruRU}>
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Скрыть форму' : 'Добавить письмо'}
          </Button>
          
          <Button
            type={showFilters ? 'primary' : 'default'}
            onClick={handleToggleFilters}
          >
            {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
          </Button>
          
          <Button
            icon={<SettingOutlined />}
            onClick={() => setShowColumnsDrawer(true)}
          />
          
          <ExportLettersButton letters={filteredLetters} />
        </div>

        {showAddForm && (
          <Card style={{ marginBottom: 24 }}>
            <AddLetterForm
              form={form}
              initialValues={initialValues}
              onFinish={handleAddLetter}
              loading={add.isPending}
            />
          </Card>
        )}

        {showFilters && (
          <Card style={{ marginBottom: 24 }}>
            <CorrespondenceFilters
              filters={filters}
              onSubmit={handleFiltersSubmit}
              onReset={handleFiltersReset}
            />
          </Card>
        )}

        {error ? (
          <Alert
            type="error"
            message={`Ошибка загрузки данных: ${error.message}`}
            style={{ marginBottom: 16 }}
          />
        ) : (
          <CorrespondenceTable
            letters={filteredLetters}
            filters={filters}
            loading={lettersLoading}
            onView={(id) => setViewId(String(id))}
            onLink={(letter) => setLinkFor(letter)}
            onUnlink={handleUnlinkLetter}
            onDelete={handleDeleteLetter}
            lockedUnitIds={lockedUnitIds}
          />
        )}

        <div style={{ marginTop: 16 }}>
          <Typography.Text style={{ display: 'block' }}>
            Всего писем: {statistics.total}, из них открытых: {statistics.open}, закрытых: {statistics.closed}
          </Typography.Text>
          <Typography.Text style={{ display: 'block', marginTop: 4 }}>
            Входящих: {statistics.incoming}, исходящих: {statistics.outgoing}
          </Typography.Text>
        </div>

        <LinkLettersDialog
          open={!!linkFor}
          parent={linkFor}
          letters={filteredLetters}
          loading={linkLetters.isPending}
          onClose={() => setLinkFor(null)}
          onSubmit={handleLinkLetters}
        />

        <LetterViewModal
          open={viewId !== null}
          letterId={viewId}
          onClose={() => setViewId(null)}
        />

        <React.Suspense fallback={null}>
          <TableColumnsDrawer
            open={showColumnsDrawer}
            columns={[]}
            widths={{}}
            onWidthsChange={() => {}}
            onChange={() => {}}
            onClose={() => setShowColumnsDrawer(false)}
            onReset={() => {}}
          />
        </React.Suspense>
      </div>
    </ConfigProvider>
  );
}