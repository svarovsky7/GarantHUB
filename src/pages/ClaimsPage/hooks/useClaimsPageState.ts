import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import { useLinkClaims, useUnlinkClaim } from '@/entities/claim';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import type { ClaimFilters } from '@/shared/types/claimFilters';

const LS_HIDE_CLOSED = "claimsHideClosed";
const LS_SHOW_FILTERS = "claimsShowFilters";

export function useClaimsPageState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const linkClaims = useLinkClaims();
  const unlinkClaim = useUnlinkClaim();

  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_SHOW_FILTERS);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);

  // Modal State
  const [viewId, setViewId] = useState<string | null>(null);
  const [linkFor, setLinkFor] = useState<ClaimWithNames | null>(null);

  // Filters State
  const [filters, setFilters] = useState<ClaimFilters>(() => {
    try {
      const saved = localStorage.getItem(LS_HIDE_CLOSED);
      const hideClosed = saved ? JSON.parse(saved) : false;
      return hideClosed ? { hideClosed } : {};
    } catch {
      return {} as ClaimFilters;
    }
  });

  // URL sync for view modal
  useEffect(() => {
    const claimId = searchParams.get('claim_id');
    if (claimId) {
      setViewId(claimId);
    }
  }, [searchParams]);

  // URL sync for add form
  useEffect(() => {
    if (searchParams.get('open_form') === '1') {
      setShowAddForm(true);
    }
  }, [searchParams]);

  // Save filters visibility to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_SHOW_FILTERS, JSON.stringify(showFilters));
    } catch {}
  }, [showFilters]);

  // Handlers
  const handleToggleAddForm = useCallback(() => {
    setShowAddForm(prev => !prev);
  }, []);

  const handleCloseAddForm = useCallback(() => {
    setShowAddForm(false);
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
    const params = new URLSearchParams(searchParams);
    params.set('claim_id', id);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleCloseView = useCallback(() => {
    setViewId(null);
    const params = new URLSearchParams(searchParams);
    params.delete('claim_id');
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleAddChild = useCallback((claim: ClaimWithNames) => {
    setLinkFor(claim);
  }, []);

  const handleCloseLinkDialog = useCallback(() => {
    setLinkFor(null);
  }, []);

  const handleLinkClaims = useCallback((parentId: string, childIds: string[]) => {
    linkClaims.mutate(
      { parentId, childIds },
      {
        onSuccess: () => {
          message.success("Претензии связаны");
          setLinkFor(null);
        },
        onError: (e) => message.error(e.message),
      },
    );
  }, [linkClaims]);

  const applyFilters = useCallback((newFilters: ClaimFilters) => {
    setFilters(newFilters);
    if (typeof newFilters.hideClosed === 'boolean') {
      try {
        localStorage.setItem(LS_HIDE_CLOSED, JSON.stringify(newFilters.hideClosed));
      } catch {}
    }
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ hideClosed: filters.hideClosed });
  }, [filters.hideClosed]);

  // Initial values for add form from URL params
  const initialValues = useMemo(() => {
    const prj = searchParams.get('project_id');
    const unit = searchParams.get('unit_id');
    const engineer = searchParams.get('engineer_id');
    
    return {
      project_id: prj ? Number(prj) : undefined,
      unit_ids: unit ? [Number(unit)] : [],
      engineer_id: engineer || undefined,
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
    
    // Filters
    filters,
    initialValues,
    
    // Handlers
    handleToggleAddForm,
    handleCloseAddForm,
    handleToggleFilters,
    handleShowColumnsDrawer,
    handleCloseColumnsDrawer,
    handleView,
    handleCloseView,
    handleAddChild,
    handleCloseLinkDialog,
    handleLinkClaims,
    applyFilters,
    resetFilters,
    
    // Loading states
    isLinking: linkClaims.isPending,
  };
}