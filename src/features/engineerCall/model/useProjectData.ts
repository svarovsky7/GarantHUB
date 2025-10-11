import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjects } from '@/shared/hooks/useProjects';
import { useAuthStore } from '@/shared/store/authStore';

export const useProjectData = (selectedProject: number | null, selectedUnit: number | null) => {
  const profile = useAuthStore((s) => s.profile);
  const { data: allProjects = [] } = useProjects();

  // Filter projects based on user role and assigned projects
  const projects = useMemo(() => {
    if (!profile) return [];

    if (profile.role === 'ADMIN') {
      return allProjects;
    }

    if (profile.project_ids && profile.project_ids.length > 0) {
      return allProjects.filter((p) => profile.project_ids?.includes(p.id));
    }

    return [];
  }, [allProjects, profile]);

  // Load units for selected project
  const { data: units = [], isLoading: unitsLoading } = useQuery({
    queryKey: ['units-for-engineer-call', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];

      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('project_id', selectedProject)
        .order('name');

      if (error) {
        console.error('Error loading units:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!selectedProject,
  });

  // Load claims for selected project
  const { data: projectClaims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ['claims-for-engineer-call', selectedProject, selectedUnit],
    queryFn: async () => {
      if (!selectedProject) return [];

      let query = supabase
        .from('claims')
        .select(`
          id,
          claim_no,
          project_id,
          claim_units!inner(unit_id)
        `)
        .eq('project_id', selectedProject);

      if (selectedUnit) {
        query = query.eq('claim_units.unit_id', selectedUnit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading claims:', error);
        return [];
      }

      const claims = (data || []).map((claim) => ({
        id: claim.id,
        claim_no: claim.claim_no,
        project_id: claim.project_id,
        unit_ids: claim.claim_units?.map((cu: any) => cu.unit_id) || [],
      }));

      return claims;
    },
    enabled: !!selectedProject,
  });

  // Get unique buildings
  const buildings = useMemo(() => {
    if (!selectedProject || units.length === 0) return [];

    const uniqueBuildings = [...new Set(units.map((u) => u.building).filter(Boolean))];
    const sortedBuildings = uniqueBuildings.sort((a, b) => {
      const aNum = parseInt(a.match(/\d+/)?.[0] || '0');
      const bNum = parseInt(b.match(/\d+/)?.[0] || '0');

      if (aNum !== bNum) return aNum - bNum;
      return a.localeCompare(b, 'ru');
    });

    return sortedBuildings.map((buildingName) => ({
      id: buildingName,
      name: buildingName,
      project_id: selectedProject,
    }));
  }, [units, selectedProject]);

  return {
    projects,
    units,
    unitsLoading,
    buildings,
    projectClaims,
    claimsLoading,
  };
};
