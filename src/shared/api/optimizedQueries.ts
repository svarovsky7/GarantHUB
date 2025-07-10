import { supabase } from './supabaseClient';
import { ClaimFilters } from '@/shared/types/claimFilters';
import { DefectFilters } from '@/shared/types/defectFilters';
import { CourtCasesFilters } from '@/shared/types/courtCasesFilters';

export const optimizedQueries = {
  // Оптимизированные запросы для претензий
  claims: {
    // Получение претензий с полной информацией (заменяет N+1 запросы)
    async getWithDetails(projectId: number, filters: ClaimFilters = {}, page = 0, limit = 50) {
      let query = supabase
        .from('claims_with_details')
        .select('*')
        .eq('project_id', projectId);

      // Применяем фильтры
      if (filters.status) query = query.eq('claim_status_id', filters.status);
      if (filters.engineer) query = query.eq('engineer_id', filters.engineer);
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
      if (filters.search) {
        query = query.or(`claim_no.ilike.%${filters.search}%,description.ilike.%${filters.search}%,owner.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      return { data, error, count };
    },

    // Получение связанных помещений для претензий
    async getUnitsForClaims(claimIds: number[]) {
      const { data, error } = await supabase
        .from('claim_units')
        .select(`
          claim_id,
          unit_id,
          units!inner (
            id,
            name,
            building,
            floor
          )
        `)
        .in('claim_id', claimIds);

      return { data, error };
    },

    // Получение связанных дефектов для претензий
    async getDefectsForClaims(claimIds: number[]) {
      const { data, error } = await supabase
        .from('claim_defects')
        .select(`
          claim_id,
          defect_id,
          pre_trial_claim,
          defects!inner (
            id,
            description,
            type_id,
            status_id,
            created_at
          )
        `)
        .in('claim_id', claimIds);

      return { data, error };
    },

    // Получение вложений для претензий
    async getAttachmentsForClaims(claimIds: number[]) {
      const { data, error } = await supabase
        .from('claim_attachments')
        .select(`
          claim_id,
          attachment_id,
          attachments!inner (
            id,
            original_name,
            mime_type,
            storage_path,
            uploaded_at
          )
        `)
        .in('claim_id', claimIds);

      return { data, error };
    }
  },

  // Оптимизированные запросы для дефектов
  defects: {
    async getWithDetails(projectId: number, filters: DefectFilters = {}, page = 0, limit = 50) {
      let query = supabase
        .from('defects_with_details')
        .select('*')
        .eq('project_id', projectId);

      // Применяем фильтры
      if (filters.status) query = query.eq('status_id', filters.status);
      if (filters.type) query = query.eq('type_id', filters.type);
      if (filters.unit) query = query.eq('unit_id', filters.unit);
      if (filters.brigade) query = query.eq('brigade_id', filters.brigade);
      if (filters.contractor) query = query.eq('contractor_id', filters.contractor);
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
      if (filters.search) {
        query = query.ilike('description', `%${filters.search}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      return { data, error, count };
    },

    async getAttachmentsForDefects(defectIds: number[]) {
      const { data, error } = await supabase
        .from('defect_attachments')
        .select(`
          defect_id,
          attachment_id,
          attachments!inner (
            id,
            original_name,
            mime_type,
            storage_path,
            uploaded_at
          )
        `)
        .in('defect_id', defectIds);

      return { data, error };
    }
  },

  // Оптимизированные запросы для судебных дел
  courtCases: {
    async getWithDetails(projectId: number, filters: CourtCasesFilters = {}, page = 0, limit = 50) {
      let query = supabase
        .from('court_cases_with_details')
        .select('*')
        .eq('project_id', projectId);

      // Применяем фильтры
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.lawyer) query = query.eq('responsible_lawyer_id', filters.lawyer);
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
      if (filters.search) {
        query = query.or(`number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      return { data, error, count };
    },

    async getPartiesForCases(caseIds: number[]) {
      const { data, error } = await supabase
        .from('court_case_parties')
        .select(`
          case_id,
          role,
          contractor_id,
          person_id,
          contractors (id, name),
          persons (id, full_name)
        `)
        .in('case_id', caseIds);

      return { data, error };
    },

    async getClaimsForCases(caseIds: number[]) {
      const { data, error } = await supabase
        .from('court_case_claims')
        .select(`
          case_id,
          claim_type_id,
          claimed_amount,
          confirmed_amount,
          paid_amount,
          agreed_amount,
          lawsuit_claim_types!inner (
            id,
            name
          )
        `)
        .in('case_id', caseIds);

      return { data, error };
    }
  },

  // Оптимизированные запросы для корреспонденции
  letters: {
    async getWithDetails(projectId: number, filters: any = {}, page = 0, limit = 50) {
      let query = supabase
        .from('letters_with_details')
        .select('*')
        .eq('project_id', projectId);

      // Применяем фильтры
      if (filters.type) query = query.eq('letter_type_id', filters.type);
      if (filters.status) query = query.eq('status_id', filters.status);
      if (filters.direction) query = query.eq('direction', filters.direction);
      if (filters.dateFrom) query = query.gte('letter_date', filters.dateFrom);
      if (filters.dateTo) query = query.lte('letter_date', filters.dateTo);
      if (filters.search) {
        query = query.or(`number.ilike.%${filters.search}%,subject.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query
        .order('letter_date', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      return { data, error, count };
    }
  },

  // Статистика и дашборд
  dashboard: {
    async getStats(projectId: number) {
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        p_project_id: projectId
      });

      return { data: data?.[0], error };
    },

    async getProjectStatistics(projectId?: number) {
      let query = supabase.from('project_statistics').select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      return { data, error };
    }
  },

  // Матрица помещений
  units: {
    async getMatrix(projectId: number) {
      const { data, error } = await supabase.rpc('get_units_matrix', {
        p_project_id: projectId
      });

      return { data, error };
    },

    async getUnitsWithCounts(projectId: number) {
      const { data, error } = await supabase
        .from('units')
        .select(`
          *,
          claim_units!left (count),
          defects!left (count)
        `)
        .eq('project_id', projectId)
        .order('building', { ascending: true })
        .order('floor', { ascending: true })
        .order('name', { ascending: true });

      return { data, error };
    }
  },

  // Пакетные операции
  batch: {
    async getRelatedData(entityType: 'claim' | 'defect' | 'court_case' | 'letter', entityIds: number[]) {
      const queries = [];

      switch (entityType) {
        case 'claim':
          queries.push(
            this.claims.getUnitsForClaims(entityIds),
            this.claims.getDefectsForClaims(entityIds),
            this.claims.getAttachmentsForClaims(entityIds)
          );
          break;
        case 'defect':
          queries.push(
            this.defects.getAttachmentsForDefects(entityIds)
          );
          break;
        case 'court_case':
          queries.push(
            this.courtCases.getPartiesForCases(entityIds),
            this.courtCases.getClaimsForCases(entityIds)
          );
          break;
      }

      const results = await Promise.all(queries);
      return results;
    },

    // Обновление нескольких записей одним запросом
    async updateMultiple(tableName: string, updates: { id: number; [key: string]: any }[]) {
      const { data, error } = await supabase.rpc('update_multiple_records', {
        table_name: tableName,
        updates: updates
      });

      return { data, error };
    }
  }
};

// Типы для результатов оптимизированных запросов
export type ClaimWithDetails = {
  id: number;
  project_id: number;
  claim_status_id: number;
  claim_no: string;
  claimed_on: string;
  accepted_on: string;
  registered_on: string;
  resolved_on: string;
  engineer_id: string;
  description: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  case_uid_id: number;
  pre_trial_claim: boolean;
  owner: string;
  project_name: string;
  status_name: string;
  status_color: string;
  engineer_name: string;
  engineer_email: string;
  case_uid: string;
  attachments_count: number;
  units_count: number;
  defects_count: number;
};

export type DefectWithDetails = {
  id: number;
  description: string;
  created_at: string;
  updated_at: string;
  type_id: number;
  status_id: number;
  received_at: string;
  fixed_at: string;
  brigade_id: number;
  contractor_id: number;
  fixed_by: string;
  is_warranty: boolean;
  project_id: number;
  unit_id: number;
  created_by: string;
  updated_by: string;
  case_uid_id: number;
  engineer_id: string;
  project_name: string;
  unit_name: string;
  unit_building: string;
  unit_floor: number;
  type_name: string;
  status_name: string;
  status_color: string;
  brigade_name: string;
  contractor_name: string;
  engineer_name: string;
  fixed_by_name: string;
  case_uid: string;
  attachments_count: number;
};

export type CourtCaseWithDetails = {
  id: number;
  project_id: number;
  status: number;
  responsible_lawyer_id: string;
  fix_start_date: string;
  fix_end_date: string;
  created_at: string;
  updated_at: string;
  date: string;
  number: string;
  description: string;
  case_uid_id: number;
  created_by: string;
  total_claim_amount: number;
  project_name: string;
  status_name: string;
  status_color: string;
  lawyer_name: string;
  lawyer_email: string;
  case_uid: string;
  attachments_count: number;
  units_count: number;
  parties_count: number;
  claims_count: number;
};

export type LetterWithDetails = {
  id: number;
  project_id: number;
  number: string;
  letter_type_id: number;
  letter_date: string;
  subject: string;
  content: string;
  status_id: number;
  sender_person_id: number;
  sender_contractor_id: number;
  receiver_person_id: number;
  receiver_contractor_id: number;
  direction: string;
  responsible_user_id: string;
  created_at: string;
  created_by: string;
  project_name: string;
  letter_type_name: string;
  status_name: string;
  status_color: string;
  responsible_user_name: string;
  sender_person_name: string;
  sender_contractor_name: string;
  receiver_person_name: string;
  receiver_contractor_name: string;
  attachments_count: number;
  units_count: number;
};

export type DashboardStats = {
  claims_total: number;
  claims_open: number;
  claims_resolved: number;
  defects_total: number;
  defects_fixed: number;
  defects_open: number;
  court_cases_total: number;
  letters_total: number;
  units_total: number;
};

export type UnitsMatrix = {
  unit_id: number;
  unit_name: string;
  building: string;
  floor: number;
  claims_count: number;
  defects_count: number;
  court_cases_count: number;
  letters_count: number;
};

export type ProjectStatistics = {
  project_id: number;
  project_name: string;
  claims_total: number;
  claims_open: number;
  claims_resolved: number;
  defects_total: number;
  defects_fixed: number;
  defects_open: number;
  court_cases_total: number;
  letters_total: number;
  units_total: number;
  last_claim_date: string;
  last_defect_date: string;
  last_court_case_date: string;
  last_letter_date: string;
};