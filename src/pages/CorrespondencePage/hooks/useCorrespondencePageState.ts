import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Form } from 'antd';
import { useLinkLetters, useUnlinkLetter } from '@/entities/correspondence';
import { useNotify } from '@/shared/hooks/useNotify';
import type { CorrespondenceLetter } from '@/shared/types/correspondence';
import dayjs from 'dayjs';

interface Filters {
  period?: [dayjs.Dayjs, dayjs.Dayjs] | null;
  type?: 'incoming' | 'outgoing' | '';
  id?: number[];
  category?: number | '';
  project?: number | '';
  building?: string | '';
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

export function useCorrespondencePageState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const linkLetters = useLinkLetters();
  const unlinkLetter = useUnlinkLetter();
  const notify = useNotify();
  const [form] = Form.useForm();
  const hideOnScroll = useRef(false);

  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_FILTERS_VISIBLE_KEY);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);

  // Modal State
  const [viewId, setViewId] = useState<string | null>(null);
  const [linkFor, setLinkFor] = useState<CorrespondenceLetter | null>(null);

  // Filters State
  const [filters, setFilters] = useState<Filters>(() => {
    let hideClosed = false;
    try {
      const saved = localStorage.getItem(LS_HIDE_CLOSED_KEY);
      hideClosed = saved ? JSON.parse(saved) : false;
    } catch {}
    
    const prj = searchParams.get('project_id');
    const unit = searchParams.get('unit_id');
    
    return {
      period: null,
      type: '',
      id: [],
      category: '',
      project: prj ? Number(prj) : '',
      building: '',
      unit: unit ? Number(unit) : '',
      sender: '',
      receiver: '',
      subject: '',
      content: '',
      status: '',
      responsible: '',
      hideClosed,
    } as Filters;
  });

  // URL sync effects
  useEffect(() => {
    if (searchParams.get('open_form') === '1') {
      setShowAddForm(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const letterId = searchParams.get('letter_id');
    if (letterId) {
      setViewId(letterId);
    }
  }, [searchParams]);

  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      const arr = ids
        .split(',')
        .map((v) => Number(v))
        .filter(Boolean);
      setFilters((f) => ({ ...f, id: arr }));
      form.setFieldValue('id', arr);
    }
    
    const prj = searchParams.get('project_id');
    const unit = searchParams.get('unit_id');
    setFilters((f) => ({
      ...f,
      project: prj ? Number(prj) : f.project,
      unit: unit ? Number(unit) : f.unit,
    }));
  }, [searchParams, form]);

  // Storage event listener
  useEffect(() => {
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

  // Save filters visibility to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_FILTERS_VISIBLE_KEY, JSON.stringify(showFilters));
    } catch {}
  }, [showFilters]);

  // Handlers
  const handleToggleAddForm = useCallback(() => {
    setShowAddForm(prev => !prev);
  }, []);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleShowColumnsDrawer = useCallback(() => {
    setShowColumnsDrawer(true);
  }, []);

  const handleCloseColumnsDrawer = useCallback(() => {
    setShowColumnsDrawer(false);
  }, []);

  const handleView = useCallback((id: string) => {
    setViewId(id);
  }, []);

  const handleCloseView = useCallback(() => {
    setViewId(null);
    const params = new URLSearchParams(searchParams);
    params.delete('letter_id');
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleAddChild = useCallback((letter: CorrespondenceLetter) => {
    setLinkFor(letter);
  }, []);

  const handleCloseLinkDialog = useCallback(() => {
    setLinkFor(null);
  }, []);

  const handleLinkLetters = useCallback((ids: string[]) => {
    if (!linkFor) return;
    
    linkLetters.mutate({ parentId: linkFor.id, childIds: ids }, {
      onSuccess: () => {
        notify.success('Письма связаны');
        setLinkFor(null);
      },
    });
  }, [linkFor, linkLetters, notify]);

  const handleUnlink = useCallback((id: string) => {
    unlinkLetter.mutate(id, {
      onSuccess: () => notify.success('Письмо исключено из связи'),
    });
  }, [unlinkLetter, notify]);

  const handleFiltersChange = useCallback((_: any, values: any) => {
    setFilters({
      period: values.period ?? null,
      type: values.type ?? '',
      id: values.id ?? [],
      category: values.category ?? '',
      project: values.project ?? '',
      building: values.building ?? '',
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
  }, []);

  const resetFilters = useCallback(() => {
    form.resetFields();
    setFilters({
      period: null,
      type: '',
      id: [],
      category: '',
      project: '',
      building: '',
      unit: '',
      sender: '',
      receiver: '',
      subject: '',
      content: '',
      status: '',
      responsible: '',
      hideClosed: filters.hideClosed,
    });
  }, [form, filters.hideClosed]);

  const handleHideFormOnScroll = useCallback(() => {
    setShowAddForm(false);
  }, []);

  // Initial values for add form from URL params
  const initialValues = useMemo(() => {
    return {
      project_id: searchParams.get('project_id')
        ? Number(searchParams.get('project_id')!)
        : undefined,
      unit_ids: searchParams.get('unit_id')
        ? [Number(searchParams.get('unit_id')!)]
        : [],
      responsible_user_id: searchParams.get('responsible_user_id') || undefined,
    };
  }, [searchParams]);

  return {
    // UI State
    showAddForm,
    showFilters,
    showColumnsDrawer,
    
    // Modal State
    viewId,
    linkFor,
    
    // Form
    form,
    filters,
    initialValues,
    hideOnScrollRef: hideOnScroll,
    
    // Handlers
    handleToggleAddForm,
    handleToggleFilters,
    handleShowColumnsDrawer,
    handleCloseColumnsDrawer,
    handleView,
    handleCloseView,
    handleAddChild,
    handleCloseLinkDialog,
    handleLinkLetters,
    handleUnlink,
    handleFiltersChange,
    resetFilters,
    handleHideFormOnScroll,
  };
}