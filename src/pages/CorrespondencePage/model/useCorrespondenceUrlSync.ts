import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FormInstance } from 'antd';
import type { CorrespondenceLetter } from '@/shared/types/correspondence';
import type { Filters } from './useCorrespondenceFilters';

interface UseCorrespondenceUrlSyncParams {
  searchParams: URLSearchParams;
  letters: CorrespondenceLetter[];
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  form: FormInstance;
  setViewId: (id: string | null) => void;
  setShowAddForm: (show: boolean) => void;
}

/**
 * Hook for syncing URL parameters with component state
 */
export function useCorrespondenceUrlSync({
  searchParams,
  letters,
  setFilters,
  form,
  setViewId,
  setShowAddForm,
}: UseCorrespondenceUrlSyncParams) {
  // Auto-open add form if URL param is present
  useEffect(() => {
    if (searchParams.get('open_form') === '1') {
      setShowAddForm(true);
    }
  }, [searchParams, setShowAddForm]);

  // Sync filters with URL parameters
  useEffect(() => {
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
    const letterId = searchParams.get('letter_id');
    if (letterId) {
      setViewId(letterId);
    }
    const prj = searchParams.get('project_id');
    const unit = searchParams.get('unit_id');
    setFilters((f) => ({
      ...f,
      project: prj ? Number(prj) : f.project,
      unit: unit ? Number(unit) : f.unit,
    }));
  }, [searchParams, letters, setFilters, form, setViewId]);
}
