# DB Index Summary

## attachments
- `attachments_pkey` - `UNIQUE id`

## brigades
- `brigades_pkey` - `UNIQUE id`

## court_cases_uids
- `court_cases_uids_pkey` - `UNIQUE id`
- `court_cases_uids_uid_key` - `UNIQUE uid`

## claim_attachments
- `claim_attachments_pkey` - `UNIQUE claim_id, attachment_id`

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
- `idx_claims_project` - `project_id`
- `idx_claims_status` - `claim_status_id`

## contractors
- `contractors_pkey` - `UNIQUE id`

## court_case_attachments
- `court_case_attachments_pkey` - `UNIQUE court_case_id, attachment_id`

## court_case_claims
- `court_case_claims_pkey` - `UNIQUE id`

## court_case_defects
- `court_case_defects_pkey` - `UNIQUE case_id, defect_id`

## court_case_links
- `court_case_links_child_id_key` - `UNIQUE child_id`
- `court_case_links_pkey` - `UNIQUE id`

## court_case_parties
- `court_case_parties_pkey` - `UNIQUE id`

## court_case_units
- `court_case_units_pkey` - `UNIQUE court_case_id, unit_id`

## court_cases
- `court_cases_pkey` - `UNIQUE id`

## defect_attachments
- `defect_attachments_pkey` - `UNIQUE defect_id, attachment_id`
- `idx_defect_attachments_file` - `attachment_id`

## defect_deadlines
- `defect_deadlines_pkey` - `UNIQUE id`
- `defect_deadlines_project_id_ticket_type_id_key` - `UNIQUE project_id, defect_type_id`

## defect_types
- `ticket_types_pkey` - `UNIQUE id`

## defects
- `defects_pkey` - `UNIQUE id`

## lawsuit_claim_types
- `lawsuit_claim_types_pkey` - `UNIQUE id`

## letter_attachments
- `letter_attachments_pkey` - `UNIQUE letter_id, attachment_id`

## letter_links
- `idx_letter_links_parent` - `parent_id`
- `letter_links_id_key` - `UNIQUE id`
- `letter_links_pkey` - `UNIQUE parent_id, child_id`

## letter_types
- `letter_types_name_key` - `UNIQUE name`
- `letter_types_pkey` - `UNIQUE id`

## letter_units
- `idx_letter_units_unit` - `unit_id`
- `letter_units_pkey` - `UNIQUE letter_id, unit_id`

## letters
- `idx_letters_project` - `project_id`
- `letters_pkey` - `UNIQUE id`

## persons
- `persons_passport_unique` - `UNIQUE passport_series, passport_number`
- `persons_pkey` - `UNIQUE id`

## profiles
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
- `statuses_pkey` - `UNIQUE id`

## unit_attachments
- `idx_unit_attachments_file` - `attachment_id`
- `unit_attachments_pkey` - `UNIQUE unit_id, attachment_id`

## unit_sort_orders
- `unit_sort_orders_pkey` - `UNIQUE id`
- `unit_sort_orders_project_id_building_floor_key` - `UNIQUE project_id, building, floor`

## units
- `idx_units_project` - `project_id`
- `idx_units_project_building` - `project_id, building`
- `units_pkey` - `UNIQUE id`
