import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/shared/store/authStore';

export function useUserProjects() {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['user-projects', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await supabase
        .from('profiles_projects')
        .select('project_id')
        .eq('profile_id', profile.id);

      if (error) {
        console.error('[useUserProjects] Error fetching user projects:', error);
        throw error;
      }

      console.log('[useUserProjects] User projects:', data);
      return data?.map(p => p.project_id) || [];
    },
    enabled: !!profile?.id
  });
}

export function useUserClaims(projectIds: number[]) {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['user-claims', profile?.id, projectIds],
    queryFn: async () => {
      if (!profile?.id || projectIds.length === 0) return [];

      const query = supabase
        .from('claims')
        .select(`
          *,
          claim_status:claim_status_id(name, color)
        `)
        .eq('engineer_id', profile.id)
        .in('project_id', projectIds);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && projectIds.length > 0
  });
}

export function useUserClaimsWithDefects(projectIds: number[]) {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['user-claims-with-defects', profile?.id, projectIds],
    queryFn: async () => {
      console.log('[useUserClaimsWithDefects] Fetching claims with defects for user:', profile?.email);
      if (!profile?.id || projectIds.length === 0) return [];

      const claimsQuery = supabase
        .from('claims')
        .select(`
          *,
          claim_status:claim_status_id(name, color),
          units:claim_units(unit:unit_id(id, name, building, floor)),
          project:project_id(name)
        `)
        .eq('engineer_id', profile.id)
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });

      const { data: claims, error: claimsError } = await claimsQuery;
      if (claimsError) {
        console.error('[useUserClaimsWithDefects] Error fetching claims:', claimsError);
        throw claimsError;
      }
      console.log('[useUserClaimsWithDefects] Fetched claims:', claims?.length || 0);

      const claimsWithDefectsData = await Promise.all(
        (claims || []).map(async (claim) => {
          const { data: claimDefects } = await supabase
            .from('claim_defects')
            .select('defect_id')
            .eq('claim_id', claim.id);

          const defectIds = claimDefects?.map(d => d.defect_id) || [];

          const { data: defects } = defectIds.length > 0
            ? await supabase
                .from('defects')
                .select('*')
                .in('id', defectIds)
                .order('created_at', { ascending: false })
            : { data: [] };

          let defectsWithRelations = defects || [];
          if (defects && defects.length > 0) {
            const statusIds = [...new Set(defects.map(d => d.status_id).filter(Boolean))];
            const { data: statuses } = statusIds.length > 0
              ? await supabase.from('statuses').select('*').in('id', statusIds)
              : { data: [] };
            const statusMap = new Map(statuses?.map(s => [s.id, s]) || []);

            const typeIds = [...new Set(defects.map(d => d.type_id).filter(Boolean))];
            const { data: types } = typeIds.length > 0
              ? await supabase.from('defect_types').select('*').in('id', typeIds)
              : { data: [] };
            const typeMap = new Map(types?.map(t => [t.id, t]) || []);

            const brigadeIds = [...new Set(defects.map(d => d.brigade_id).filter(Boolean))];
            const { data: brigades } = brigadeIds.length > 0
              ? await supabase.from('brigades').select('*').in('id', brigadeIds)
              : { data: [] };
            const brigadeMap = new Map(brigades?.map(b => [b.id, b]) || []);

            const contractorIds = [...new Set(defects.map(d => d.contractor_id).filter(Boolean))];
            const { data: contractors } = contractorIds.length > 0
              ? await supabase.from('contractors').select('*').in('id', contractorIds)
              : { data: [] };
            const contractorMap = new Map(contractors?.map(c => [c.id, c]) || []);

            defectsWithRelations = defects.map(d => ({
              ...d,
              status: d.status_id ? statusMap.get(d.status_id) : null,
              type: d.type_id ? typeMap.get(d.type_id) : null,
              brigade: d.brigade_id ? brigadeMap.get(d.brigade_id) : null,
              contractor: d.contractor_id ? contractorMap.get(d.contractor_id) : null
            }));
          }

          console.log(`[useUserClaimsWithDefects] Loaded ${defectsWithRelations.length} defects for claim ${claim.claim_no}`);

          return {
            ...claim,
            defects: defectsWithRelations
          };
        })
      );

      console.log('[useUserClaimsWithDefects] Total claims with defects loaded:', claimsWithDefectsData.length);
      return claimsWithDefectsData;
    },
    enabled: !!profile?.id && projectIds.length > 0
  });
}

export function useUserLetters(projectIds: number[]) {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['user-letters', profile?.id, projectIds],
    queryFn: async () => {
      if (!profile?.id || projectIds.length === 0) return [];

      const query = supabase
        .from('letters')
        .select(`
          *,
          sender_person:sender_person_id(full_name),
          sender_contractor:sender_contractor_id(name),
          receiver_person:receiver_person_id(full_name),
          receiver_contractor:receiver_contractor_id(name),
          status:status_id(name, color)
        `)
        .eq('responsible_user_id', profile.id)
        .in('project_id', projectIds);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && projectIds.length > 0
  });
}

export function useUserEngineerCalls(projectIds: number[]) {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['user-engineer-calls', profile?.id, projectIds],
    queryFn: async () => {
      if (!profile?.id || projectIds.length === 0) return [];

      const query = supabase
        .from('engineer_calls')
        .select(`
          *,
          project:projects(id, name),
          unit:units(id, name, floor, building),
          claim:claims(id, claim_no)
        `)
        .eq('engineer_id', profile.id)
        .in('project_id', projectIds);

      const { data, error } = await query.order('start_datetime', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && projectIds.length > 0
  });
}
