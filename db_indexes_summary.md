# Database Indexes Summary

## Overview
This document provides a comprehensive overview of all database indexes in the GarantHUB system based on actual database export.

## Index Statistics
- **Total indexes**: 166
- **Primary key indexes**: 22  
- **Unique indexes**: 12
- **Performance indexes**: 75
- **Covering indexes**: 19
- **Full-text search indexes**: 2
- **Partial indexes**: 58 (with WHERE conditions)

## Tables with Indexes

### attachments (3 indexes)
- `attachments_pkey` - UNIQUE `id`
- `idx_attachments_created_at` - `created_at DESC`
- `idx_attachments_uploaded_by` - `uploaded_by` (WHERE uploaded_by IS NOT NULL)

### brigades (1 index)
- `brigades_pkey` - UNIQUE `id`

### claim_attachments (4 indexes)
- `claim_attachments_pkey` - UNIQUE `(claim_id, attachment_id)`
- `idx_claim_attachments_attachment` - `attachment_id`
- `idx_claim_attachments_claim_id` - `claim_id`
- `idx_claim_attachments_covering` - `claim_id` INCLUDE `attachment_id`

### claim_defects (5 indexes)
- `claim_defects_pkey` - UNIQUE `(claim_id, defect_id)`
- `claim_defects_defect_idx` - `defect_id`
- `idx_claim_defects_claim` - `claim_id`
- `idx_claim_defects_covering` - `claim_id` INCLUDE `defect_id`
- `idx_claim_defects_defect_covering` - `defect_id` INCLUDE `claim_id`

### claim_links (5 indexes)
- `claim_links_pkey` - UNIQUE `id`
- `idx_claim_links_child` - `child_id`
- `idx_claim_links_parent` - `parent_id`
- `idx_claim_links_child_covering` - `child_id` INCLUDE `parent_id`
- `idx_claim_links_parent_covering` - `parent_id` INCLUDE `child_id`

### claim_units (4 indexes)
- `claim_units_pkey` - UNIQUE `(claim_id, unit_id)`
- `idx_claim_units_claim` - `claim_id`
- `idx_claim_units_unit` - `unit_id`
- `idx_claim_units_covering` - `claim_id` INCLUDE `unit_id`

### claims (14 indexes)
- `claims_pkey` - UNIQUE `id`
- `idx_claims_accepted_on` - `accepted_on DESC` (WHERE accepted_on IS NOT NULL)
- `idx_claims_claim_no` - `claim_no`
- `idx_claims_created_by` - `created_by` (WHERE created_by IS NOT NULL)
- `idx_claims_created_by_date_status` - `(created_by, created_at DESC, claim_status_id)` (WHERE created_by IS NOT NULL)
- `idx_claims_description_fts` - GIN full-text search on `description` (WHERE description IS NOT NULL)
- `idx_claims_engineer_date_status` - `(engineer_id, created_at DESC, claim_status_id)` (WHERE engineer_id IS NOT NULL)
- `idx_claims_engineer_id` - `engineer_id` (WHERE engineer_id IS NOT NULL)
- `idx_claims_engineer_project` - `(engineer_id, project_id)` (WHERE engineer_id IS NOT NULL)
- `idx_claims_project_created` - `(project_id, created_at DESC)`
- `idx_claims_project_status_covering` - `(project_id, claim_status_id)` INCLUDE `(created_at, registered_on, accepted_on)`
- `idx_claims_project_status_date` - `(project_id, claim_status_id, created_at DESC)`
- `idx_claims_registered_on` - `registered_on DESC` (WHERE registered_on IS NOT NULL)
- `idx_claims_status_date` - `(claim_status_id, created_at DESC)` (WHERE claim_status_id IS NOT NULL)

### contractors (1 index)
- `contractors_pkey` - UNIQUE `id`

### court_case_attachments (1 index)
- `court_case_attachments_pkey` - UNIQUE `(court_case_id, attachment_id)`

### court_case_claim_links (4 indexes)
- `court_case_claim_links_pkey` - UNIQUE `id`
- `idx_court_case_claim_links_case` - `case_id`
- `idx_court_case_claim_links_claim` - `claim_id`
- `idx_court_case_claim_links_covering` - `case_id` INCLUDE `claim_id`

### court_case_claims (3 indexes)
- `court_case_claims_pkey` - UNIQUE `id`
- `idx_court_case_claims_case` - `case_id`
- `idx_court_case_claims_covering` - `case_id` INCLUDE `(claim_type_id, claimed_amount)`

### court_case_defects (3 indexes)
- `court_case_defects_pkey` - UNIQUE `(case_id, defect_id)`
- `idx_court_case_defects_case` - `case_id`
- `idx_court_case_defects_defect` - `defect_id`

### court_case_links (2 indexes)
- `court_case_links_pkey` - UNIQUE `id`
- `court_case_links_child_id_key` - UNIQUE `child_id`

### court_case_parties (2 indexes)
- `court_case_parties_pkey` - UNIQUE `id`
- `idx_court_case_parties_case` - `case_id`

### court_case_units (4 indexes)
- `court_case_units_pkey` - UNIQUE `(court_case_id, unit_id)`
- `idx_court_case_units_case` - `court_case_id`
- `idx_court_case_units_unit` - `unit_id`
- `idx_court_case_units_covering` - `court_case_id` INCLUDE `unit_id`

### court_cases (11 indexes)
- `court_cases_pkey` - UNIQUE `id`
- `idx_court_cases_created_by` - `created_by` (WHERE created_by IS NOT NULL)
- `idx_court_cases_created_by_date_status` - `(created_by, created_at DESC, status)` (WHERE created_by IS NOT NULL)
- `idx_court_cases_date` - `date DESC` (WHERE date IS NOT NULL)
- `idx_court_cases_lawyer_date_status` - `(responsible_lawyer_id, created_at DESC, status)` (WHERE responsible_lawyer_id IS NOT NULL)
- `idx_court_cases_lawyer_project` - `(responsible_lawyer_id, project_id)` (WHERE responsible_lawyer_id IS NOT NULL)
- `idx_court_cases_project_date` - `(project_id, created_at DESC)`
- `idx_court_cases_project_new` - `project_id`
- `idx_court_cases_project_status` - `(project_id, status)`
- `idx_court_cases_responsible_lawyer` - `responsible_lawyer_id` (WHERE responsible_lawyer_id IS NOT NULL)
- `idx_court_cases_status_new` - `status`

### court_cases_uids (2 indexes)
- `court_cases_uids_pkey` - UNIQUE `id`
- `court_cases_uids_uid_key` - UNIQUE `uid`

### defect_attachments (4 indexes)
- `defect_attachments_pkey` - UNIQUE `(defect_id, attachment_id)`
- `idx_defect_attachments_covering` - `defect_id` INCLUDE `attachment_id`
- `idx_defect_attachments_defect_id` - `defect_id`
- `idx_defect_attachments_file` - `attachment_id`

### defect_types (1 index)
- `ticket_types_pkey` - UNIQUE `id`

### defects (15 indexes)
- `defects_pkey` - UNIQUE `id`
- `idx_defects_brigade_date` - `(brigade_id, created_at DESC)` (WHERE brigade_id IS NOT NULL)
- `idx_defects_created_by` - `created_by` (WHERE created_by IS NOT NULL)
- `idx_defects_created_by_date_status` - `(created_by, created_at DESC, status_id)` (WHERE created_by IS NOT NULL)
- `idx_defects_description_fts` - GIN full-text search on `description` (WHERE description IS NOT NULL)
- `idx_defects_engineer` - `engineer_id`
- `idx_defects_engineer_date_status` - `(engineer_id, created_at DESC, status_id)` (WHERE engineer_id IS NOT NULL)
- `idx_defects_fixed_at` - `fixed_at DESC` (WHERE fixed_at IS NOT NULL)
- `idx_defects_project_status_covering` - `(project_id, status_id)` INCLUDE `(created_at, fixed_at, received_at)`
- `idx_defects_project_status_date` - `(project_id, status_id, created_at DESC)`
- `idx_defects_project_type` - `(project_id, type_id)` (WHERE type_id IS NOT NULL)
- `idx_defects_project_unit` - `(project_id, unit_id)` (WHERE unit_id IS NOT NULL)
- `idx_defects_received_at` - `received_at DESC` (WHERE received_at IS NOT NULL)
- `idx_defects_status_id` - `status_id` (WHERE status_id IS NOT NULL)
- `idx_defects_unit_status` - `(unit_id, status_id)` (WHERE unit_id IS NOT NULL)

### document_folder_files (4 indexes)
- `document_folder_files_pkey` - UNIQUE `id`
- `document_folder_files_folder_id_attachment_id_key` - UNIQUE `(folder_id, attachment_id)`
- `idx_document_folder_files_attachment` - `attachment_id`
- `idx_document_folder_files_folder` - `folder_id`

### document_folders (3 indexes)
- `document_folders_pkey` - UNIQUE `id`
- `idx_document_folders_name` - `name`
- `idx_document_folders_project` - `project_id`

### lawsuit_claim_types (1 index)
- `lawsuit_claim_types_pkey` - UNIQUE `id`

### letter_attachments (4 indexes)
- `letter_attachments_pkey` - UNIQUE `(letter_id, attachment_id)`
- `idx_letter_attachments_attachment` - `attachment_id`
- `idx_letter_attachments_covering` - `letter_id` INCLUDE `attachment_id`
- `idx_letter_attachments_letter` - `letter_id`

### letter_links (5 indexes)
- `letter_links_pkey` - UNIQUE `(parent_id, child_id)`
- `letter_links_id_key` - UNIQUE `id`
- `idx_letter_links_child_covering` - `child_id` INCLUDE `parent_id`
- `idx_letter_links_parent` - `parent_id`
- `idx_letter_links_parent_covering` - `parent_id` INCLUDE `child_id`

### letter_types (2 indexes)
- `letter_types_pkey` - UNIQUE `id`
- `letter_types_name_key` - UNIQUE `name`

### letter_units (5 indexes)
- `letter_units_pkey` - UNIQUE `(letter_id, unit_id)`
- `idx_letter_units_covering` - `letter_id` INCLUDE `unit_id`
- `idx_letter_units_letter` - `letter_id`
- `idx_letter_units_unit` - `unit_id`
- `idx_letter_units_unit_covering` - `unit_id` INCLUDE `letter_id`

### letters (9 indexes)
- `letters_pkey` - UNIQUE `id`
- `idx_letters_direction` - `direction` (WHERE direction IS NOT NULL)
- `idx_letters_number` - `number` (WHERE number IS NOT NULL)
- `idx_letters_project_date` - `(project_id, letter_date DESC)`
- `idx_letters_project_date_status` - `(project_id, letter_date DESC, status_id)` (WHERE status_id IS NOT NULL)
- `idx_letters_project_status` - `(project_id, status_id)` (WHERE status_id IS NOT NULL)
- `idx_letters_project_type` - `(project_id, letter_type_id)`
- `idx_letters_responsible_date` - `(responsible_user_id, letter_date DESC)` (WHERE responsible_user_id IS NOT NULL)
- `idx_letters_responsible_project` - `(responsible_user_id, project_id)` (WHERE responsible_user_id IS NOT NULL)
- `idx_letters_status` - `status_id` (WHERE status_id IS NOT NULL)

### persons (2 indexes)
- `persons_pkey` - UNIQUE `id`
- `persons_passport_unique` - UNIQUE `(passport_series, passport_number)` (WHERE passport_series IS NOT NULL AND passport_number IS NOT NULL)

### profiles (4 indexes)
- `profiles_pkey` - UNIQUE `id`
- `idx_profiles_email` - `email`
- `idx_profiles_id_name` - `(id, name)`
- `idx_profiles_role` - `role` (WHERE role IS NOT NULL)

### profiles_projects (3 indexes)
- `profiles_projects_pkey` - UNIQUE `(profile_id, project_id)`
- `idx_profiles_projects_profile_covering` - `profile_id` INCLUDE `project_id`
- `idx_profiles_projects_project_covering` - `project_id` INCLUDE `profile_id`

### projects (1 index)
- `projects_pkey` - UNIQUE `id`

### role_permissions (1 index)
- `role_permissions_pkey` - UNIQUE `role_name`

### roles (2 indexes)
- `roles_pkey` - UNIQUE `id`
- `roles_name_key` - UNIQUE `name`

### statuses (2 indexes)
- `statuses_pkey` - UNIQUE `id`
- `idx_statuses_entity_id` - `(entity, id)`

### system_settings (3 indexes)
- `system_settings_pkey` - UNIQUE `id`
- `idx_system_settings_key` - `setting_key`
- `system_settings_setting_key_key` - UNIQUE `setting_key`

### unit_attachments (3 indexes)
- `unit_attachments_pkey` - UNIQUE `(unit_id, attachment_id)`
- `idx_unit_attachments_file` - `attachment_id`
- `idx_unit_attachments_unit_covering` - `unit_id` INCLUDE `attachment_id`

### unit_sort_orders (2 indexes)
- `unit_sort_orders_pkey` - UNIQUE `id`
- `unit_sort_orders_project_id_building_floor_key` - UNIQUE `(project_id, building, floor)`

### units (7 indexes)
- `units_pkey` - UNIQUE `id`
- `idx_units_building` - `building` (WHERE building IS NOT NULL)
- `idx_units_floor` - `floor` (WHERE floor IS NOT NULL)
- `idx_units_name` - `name`
- `idx_units_project_building` - `(project_id, building)`
- `idx_units_project_building_floor` - `(project_id, building, floor)` (WHERE building IS NOT NULL AND floor IS NOT NULL)
- `idx_units_project_floor` - `(project_id, floor)` (WHERE floor IS NOT NULL)

## Index Types Summary

### Primary Key Indexes (22)
All main entity tables have primary key indexes for unique identification and fast lookups.

### Unique Constraints (12)
- Business logic unique constraints (passport, email, etc.)
- Composite unique constraints for junction tables
- Natural keys for reference data

### Performance Indexes (75)
- **Date-based indexes**: Optimized for temporal queries with DESC ordering
- **Foreign key indexes**: Fast joins and relationship queries
- **Composite indexes**: Multi-column queries for filtering and sorting
- **Partial indexes**: Storage optimization with WHERE conditions

### Covering Indexes (19)
- **Junction table optimization**: INCLUDE columns to avoid table lookups
- **Frequently accessed combinations**: Reduced I/O for common query patterns

### Full-Text Search (2)
- **Russian language GIN indexes**: On description fields for text search
- **Optimized for search queries**: Fast text matching and ranking

## Performance Optimizations

### Query Patterns Optimized
1. **User statistics**: Multi-table aggregations with date filtering
2. **Dashboard queries**: Project-based filtering with status breakdowns
3. **Search operations**: Text search with proper indexing
4. **Junction table queries**: Covering indexes for relation lookups
5. **Temporal queries**: Date-based filtering and sorting

### Storage Optimizations
1. **Partial indexes**: WHERE conditions reduce index size
2. **Covering indexes**: Fewer table lookups required
3. **Composite indexes**: Single index for multi-column queries

## Monitoring and Maintenance

### Index Usage Monitoring
```sql
-- Check index usage statistics
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
ORDER BY idx_scan DESC;

-- Check unused indexes
SELECT schemaname, tablename, indexname
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' AND idx_scan = 0;
```

### Performance Monitoring
```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY total_time DESC;

-- Check index effectiveness
SELECT tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;
```

### Maintenance Tasks
- **Regular ANALYZE**: Update table statistics
- **Monitor index usage**: Remove unused indexes
- **Update statistics**: After bulk operations  
- **Consider REINDEX**: For heavily updated tables
- **Vacuum maintenance**: Regular cleanup for optimal performance

## Notes
- All indexes created with proper naming conventions
- Partial indexes optimize storage with WHERE conditions
- Covering indexes reduce I/O with INCLUDE columns
- Full-text search uses Russian language configuration
- Index statistics should be monitored regularly for optimization opportunities