import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Form } from 'antd';
import dayjs from 'dayjs';
import type { CorrespondenceLetter } from '@/shared/types/correspondence';
import type { Unit } from '@/shared/types/unit';

export interface Filters {
  period?: [dayjs.Dayjs, dayjs.Dayjs] | null;
  type?: 'incoming' | 'outgoing' | '';
  id?: number[];
  category?: number | '';
  project?: number | '';
  building?: string | '';
  unit?: number | '';
  number?: string;
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

/**
 * Hook for managing correspondence filters state and persistence
 */
export function useCorrespondenceFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm();

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
      number: '',
      sender: '',
      receiver: '',
      subject: '',
      content: '',
      status: '',
      responsible: '',
      hideClosed,
    } as Filters;
  });

  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_FILTERS_VISIBLE_KEY);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Sync filters with URL params and localStorage
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

  // Sync filters visibility to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_FILTERS_VISIBLE_KEY, JSON.stringify(showFilters));
    } catch {}
  }, [showFilters]);

  const handleFiltersChange = (_: any, values: any) => {
    setFilters({
      period: values.period ?? null,
      type: values.type ?? '',
      id: values.id ?? [],
      category: values.category ?? '',
      project: values.project ?? '',
      building: values.building ?? '',
      unit: values.unit ?? '',
      number: values.number ?? '',
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
      building: '',
      unit: '',
      number: '',
      sender: '',
      receiver: '',
      subject: '',
      content: '',
      status: '',
      responsible: '',
      hideClosed: filters.hideClosed,
    });
  };

  return {
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    form,
    handleFiltersChange,
    resetFilters,
    searchParams,
    setSearchParams,
  };
}

/**
 * Hook for filtering letters based on filter criteria
 */
export function useFilteredLetters(
  letters: CorrespondenceLetter[],
  filters: Filters,
  allUnits: Unit[],
  closedStatusId: number | null,
) {
  return useMemo(() => {
    return letters.filter((l) => {
      if (filters.period && filters.period.length === 2) {
        const [from, to] = filters.period;
        const d = dayjs(l.date);
        if (d.isBefore(from, 'day') || d.isAfter(to, 'day')) return false;
      }
      if (filters.type && l.type !== filters.type) return false;
      if (filters.category && l.letter_type_id !== Number(filters.category)) return false;
      if (filters.project && l.project_id !== Number(filters.project)) return false;
      if (filters.building) {
        const letterUnits = allUnits.filter(unit => l.unit_ids.includes(unit.id));
        const hasBuilding = letterUnits.some(unit => unit.building === filters.building);
        if (!hasBuilding) return false;
      }
      if (filters.unit && !l.unit_ids.includes(Number(filters.unit))) return false;
      if (filters.id && filters.id.length) {
        const ids = filters.id.map(String);
        if (!ids.includes(String(l.id))) return false;
      }
      if (filters.status && l.status_id !== Number(filters.status)) return false;
      if (filters.responsible && String(l.responsible_user_id) !== filters.responsible) return false;
      const number = (l.number || '').toLowerCase();
      const sender = (l.sender || '').toLowerCase();
      const receiver = (l.receiver || '').toLowerCase();
      const subject = (l.subject || '').toLowerCase();
      const content = (l.content || '').toLowerCase();

      if (filters.number && !number.includes(filters.number.toLowerCase()))
        return false;
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
  }, [letters, filters, allUnits, closedStatusId]);
}
