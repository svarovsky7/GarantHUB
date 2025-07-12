# DB Index Summary

## attachments
- `attachments_pkey` - `UNIQUE id`
- `idx_attachments_created_at` - `created_at`
- `idx_attachments_uploaded_by` - `uploaded_by`

## brigades
- `brigades_pkey` - `UNIQUE id`

## claim_attachments
- `claim_attachments_pkey` - `UNIQUE claim_id, attachment_id`
- `idx_claim_attachments_attachment` - `attachment_id`
- `idx_claim_attachments_claim_id` - `claim_id`

## claim_defects
- `claim_defects_defect_idx` - `defect_id`
- `claim_defects_pkey` - `UNIQUE claim_id, defect_id`
- `idx_claim_defects_claim` - `claim_id`

## claim_links
- `claim_links_pkey` - `UNIQUE id`
- `idx_claim_links_child` - `child_id`
- `idx_claim_links_parent` - `parent_id`

## claim_units
- `claim_units_pkey` - `UNIQUE claim_id, unit_id`
- `idx_claim_units_claim` - `claim_id`
- `idx_claim_units_unit` - `unit_id`

## claims
- `claims_pkey` - `UNIQUE id`
- `idx_claims_created_by` - `created_by`
- `idx_claims_engineer_id` - `engineer_id`
- `idx_claims_engineer_project` - `engineer_id, project_id`
- `idx_claims_project_created` - `project_id, created_at`
- `idx_claims_project_status_date` - `project_id, claim_status_id, created_at`
- `idx_claims_status_date` - `claim_status_id, created_at`

## contractors
- `contractors_pkey` - `UNIQUE id`

## court_case_attachments
- `court_case_attachments_pkey` - `UNIQUE court_case_id, attachment_id`

## court_case_claim_links
- `court_case_claim_links_pkey` - `UNIQUE id`
- `idx_court_case_claim_links_case` - `case_id`
- `idx_court_case_claim_links_claim` - `claim_id`

## court_case_claims
- `court_case_claims_pkey` - `UNIQUE id`
- `idx_court_case_claims_case` - `case_id`

## court_case_defects
- `court_case_defects_pkey` - `UNIQUE case_id, defect_id`
- `idx_court_case_defects_case` - `case_id`
- `idx_court_case_defects_defect` - `defect_id`

## court_case_links
- `court_case_links_child_id_key` - `UNIQUE child_id`
- `court_case_links_pkey` - `UNIQUE id`

## court_case_parties
- `court_case_parties_pkey` - `UNIQUE id`
- `idx_court_case_parties_case` - `case_id`

## court_case_units
- `court_case_units_pkey` - `UNIQUE court_case_id, unit_id`
- `idx_court_case_units_case` - `court_case_id`
- `idx_court_case_units_unit` - `unit_id`

## court_cases
- `court_cases_pkey` - `UNIQUE id`
- `idx_court_cases_created_by` - `created_by`
- `idx_court_cases_lawyer_project` - `responsible_lawyer_id, project_id`
- `idx_court_cases_project_date` - `project_id, created_at`
- `idx_court_cases_project_new` - `project_id`
- `idx_court_cases_project_status` - `project_id, status`
- `idx_court_cases_project_status_new` - `project_id, status`
- `idx_court_cases_responsible_lawyer` - `responsible_lawyer_id`
- `idx_court_cases_status_new` - `status`

## court_cases_uids
- `court_cases_uids_pkey` - `UNIQUE id`
- `court_cases_uids_uid_key` - `UNIQUE uid`

## defect_attachments
- `defect_attachments_pkey` - `UNIQUE defect_id, attachment_id`
- `idx_defect_attachments_defect_id` - `defect_id`
- `idx_defect_attachments_file` - `attachment_id`

## defect_types
- `ticket_types_pkey` - `UNIQUE id`

## defects
- `defects_pkey` - `UNIQUE id`
- `idx_defects_brigade_date` - `brigade_id, created_at`
- `idx_defects_created_by` - `created_by`
- `idx_defects_engineer` - `engineer_id`
- `idx_defects_project_status_date` - `project_id, status_id, created_at`
- `idx_defects_project_type` - `project_id, type_id`
- `idx_defects_status_id` - `status_id`
- `idx_defects_unit_status` - `unit_id, status_id`

## lawsuit_claim_types
- `lawsuit_claim_types_pkey` - `UNIQUE id`

## letter_attachments
- `idx_letter_attachments_attachment` - `attachment_id`
- `idx_letter_attachments_letter` - `letter_id`
- `letter_attachments_pkey` - `UNIQUE letter_id, attachment_id`

## letter_links
- `idx_letter_links_parent` - `parent_id`
- `letter_links_id_key` - `UNIQUE id`
- `letter_links_pkey` - `UNIQUE parent_id, child_id`

## letter_types
- `letter_types_name_key` - `UNIQUE name`
- `letter_types_pkey` - `UNIQUE id`

## letter_units
- `idx_letter_units_letter` - `letter_id`
- `idx_letter_units_unit` - `unit_id`
- `letter_units_pkey` - `UNIQUE letter_id, unit_id`

## letters
- `idx_letters_project_date` - `project_id, letter_date`
- `idx_letters_project_status` - `project_id, status_id`
- `idx_letters_project_type` - `project_id, letter_type_id`
- `idx_letters_responsible_project` - `responsible_user_id, project_id`
- `idx_letters_status` - `status_id`
- `letters_pkey` - `UNIQUE id`

## persons
- `persons_passport_unique` - `UNIQUE passport_series, passport_number`
- `persons_pkey` - `UNIQUE id`

## profiles
- `idx_profiles_id_name` - `id, name`
- `profiles_pkey` - `UNIQUE id`

## profiles_projects
- `profiles_projects_pkey` - `UNIQUE profile_id, project_id`

## projects
- `projects_pkey` - `UNIQUE id`

## role_permissions
- `role_permissions_pkey` - `UNIQUE role_name`

## roles
- `roles_name_key` - `UNIQUE name`
- `roles_pkey` - `UNIQUE id`

## statuses
- `idx_statuses_entity_id` - `entity, id`
- `statuses_pkey` - `UNIQUE id`

## unit_attachments
- `idx_unit_attachments_file` - `attachment_id`
- `unit_attachments_pkey` - `UNIQUE unit_id, attachment_id`

## unit_sort_orders
- `unit_sort_orders_pkey` - `UNIQUE id`
- `unit_sort_orders_project_id_building_floor_key` - `UNIQUE project_id, building, floor`

## units
- `idx_units_project_building` - `project_id, building`
- `idx_units_project_building_floor` - `project_id, building, floor`
- `idx_units_project_floor` - `project_id, floor`
- `units_pkey` - `UNIQUE id`
