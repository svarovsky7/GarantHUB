-- Database Schema SQL Export
-- Generated: 2025-09-07T17:33:08.753722
-- Database: postgres
-- Host: aws-0-eu-central-1.pooler.supabase.com

-- ============================================
-- TABLES
-- ============================================

-- Table: public.attachments
CREATE TABLE IF NOT EXISTS public.attachments (
    id integer(32) NOT NULL DEFAULT nextval('attachments_id_seq'::regclass),
    path text NOT NULL,
    mime_type text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now(),
    storage_path text NOT NULL,
    original_name text,
    uploaded_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT attachments_created_by_fkey FOREIGN KEY (created_by) REFERENCES None.None(None),
    CONSTRAINT attachments_pkey PRIMARY KEY (id),
    CONSTRAINT attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES None.None(None)
);

-- Table: public.brigades
CREATE TABLE IF NOT EXISTS public.brigades (
    id integer(32) NOT NULL DEFAULT nextval('brigades_id_seq'::regclass),
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT brigades_pkey PRIMARY KEY (id)
);

-- Table: public.claim_attachments
CREATE TABLE IF NOT EXISTS public.claim_attachments (
    claim_id bigint(64) NOT NULL,
    attachment_id integer(32) NOT NULL,
    CONSTRAINT claim_attachments_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES None.None(None),
    CONSTRAINT claim_attachments_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES None.None(None),
    CONSTRAINT claim_attachments_pkey PRIMARY KEY (attachment_id),
    CONSTRAINT claim_attachments_pkey PRIMARY KEY (claim_id)
);

-- Table: public.claim_defects
CREATE TABLE IF NOT EXISTS public.claim_defects (
    claim_id bigint(64) NOT NULL,
    defect_id bigint(64) NOT NULL,
    pre_trial_claim boolean NOT NULL DEFAULT false,
    CONSTRAINT claim_defects_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES None.None(None),
    CONSTRAINT claim_defects_defect_id_fkey FOREIGN KEY (defect_id) REFERENCES None.None(None),
    CONSTRAINT claim_defects_pkey PRIMARY KEY (claim_id),
    CONSTRAINT claim_defects_pkey PRIMARY KEY (defect_id)
);

-- Table: public.claim_links
CREATE TABLE IF NOT EXISTS public.claim_links (
    id bigint(64) NOT NULL DEFAULT nextval('claim_links_id_seq'::regclass),
    parent_id bigint(64) NOT NULL,
    child_id bigint(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT claim_links_child_id_fkey FOREIGN KEY (child_id) REFERENCES None.None(None),
    CONSTRAINT claim_links_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES None.None(None),
    CONSTRAINT claim_links_pkey PRIMARY KEY (id)
);

-- Table: public.claim_units
CREATE TABLE IF NOT EXISTS public.claim_units (
    claim_id bigint(64) NOT NULL,
    unit_id integer(32) NOT NULL,
    CONSTRAINT claim_units_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES None.None(None),
    CONSTRAINT claim_units_pkey PRIMARY KEY (claim_id),
    CONSTRAINT claim_units_pkey PRIMARY KEY (unit_id),
    CONSTRAINT claim_units_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES None.None(None)
);

-- Table: public.claims
CREATE TABLE IF NOT EXISTS public.claims (
    id bigint(64) NOT NULL,
    project_id integer(32),
    claim_status_id integer(32),
    claim_no text NOT NULL,
    claimed_on date,
    accepted_on date,
    registered_on date,
    resolved_on date,
    engineer_id uuid,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    case_uid_id integer(32),
    pre_trial_claim boolean NOT NULL DEFAULT false,
    owner text,
    CONSTRAINT claims_case_uid_id_fkey FOREIGN KEY (case_uid_id) REFERENCES None.None(None),
    CONSTRAINT claims_claim_status_id_fkey FOREIGN KEY (claim_status_id) REFERENCES None.None(None),
    CONSTRAINT claims_created_by_fkey FOREIGN KEY (created_by) REFERENCES None.None(None),
    CONSTRAINT claims_engineer_id_fkey FOREIGN KEY (engineer_id) REFERENCES None.None(None),
    CONSTRAINT claims_pkey PRIMARY KEY (id),
    CONSTRAINT claims_project_id_fkey FOREIGN KEY (project_id) REFERENCES None.None(None),
    CONSTRAINT claims_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES None.None(None)
);

-- Table: public.contractors
CREATE TABLE IF NOT EXISTS public.contractors (
    id integer(32) NOT NULL DEFAULT nextval('contractors_id_seq'::regclass),
    name text NOT NULL,
    description text,
    inn character varying(12),
    phone character varying(20),
    email text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT contractors_pkey PRIMARY KEY (id)
);

-- Table: public.court_case_attachments
CREATE TABLE IF NOT EXISTS public.court_case_attachments (
    court_case_id bigint(64) NOT NULL,
    attachment_id integer(32) NOT NULL,
    CONSTRAINT court_case_attachments_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES None.None(None),
    CONSTRAINT court_case_attachments_court_case_id_fkey FOREIGN KEY (court_case_id) REFERENCES None.None(None),
    CONSTRAINT court_case_attachments_pkey PRIMARY KEY (attachment_id),
    CONSTRAINT court_case_attachments_pkey PRIMARY KEY (court_case_id)
);

-- Table: public.court_case_claim_links
CREATE TABLE IF NOT EXISTS public.court_case_claim_links (
    id bigint(64) NOT NULL DEFAULT nextval('court_case_claim_links_id_seq'::regclass),
    case_id bigint(64) NOT NULL,
    claim_id bigint(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT court_case_claim_links_case_id_fkey FOREIGN KEY (case_id) REFERENCES None.None(None),
    CONSTRAINT court_case_claim_links_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES None.None(None),
    CONSTRAINT court_case_claim_links_pkey PRIMARY KEY (id)
);

-- Table: public.court_case_claims
CREATE TABLE IF NOT EXISTS public.court_case_claims (
    id bigint(64) NOT NULL DEFAULT nextval('court_case_claims_id_seq'::regclass),
    case_id bigint(64) NOT NULL,
    claim_type_id bigint(64) NOT NULL,
    claimed_amount numeric,
    confirmed_amount numeric,
    paid_amount numeric,
    agreed_amount numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT court_case_claims_case_id_fkey FOREIGN KEY (case_id) REFERENCES None.None(None),
    CONSTRAINT court_case_claims_claim_type_id_fkey FOREIGN KEY (claim_type_id) REFERENCES None.None(None),
    CONSTRAINT court_case_claims_pkey PRIMARY KEY (id)
);

-- Table: public.court_case_defects
CREATE TABLE IF NOT EXISTS public.court_case_defects (
    case_id bigint(64) NOT NULL,
    defect_id bigint(64) NOT NULL,
    CONSTRAINT court_case_defects_case_id_fkey FOREIGN KEY (case_id) REFERENCES None.None(None),
    CONSTRAINT court_case_defects_defect_id_fkey FOREIGN KEY (defect_id) REFERENCES None.None(None),
    CONSTRAINT court_case_defects_pkey PRIMARY KEY (case_id),
    CONSTRAINT court_case_defects_pkey PRIMARY KEY (defect_id)
);

-- Table: public.court_case_links
CREATE TABLE IF NOT EXISTS public.court_case_links (
    id bigint(64) NOT NULL DEFAULT nextval('court_case_links_id_seq'::regclass),
    parent_id bigint(64) NOT NULL,
    child_id bigint(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT court_case_links_child_id_fkey FOREIGN KEY (child_id) REFERENCES None.None(None),
    CONSTRAINT court_case_links_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES None.None(None),
    CONSTRAINT court_case_links_pkey PRIMARY KEY (id)
);

-- Table: public.court_case_parties
CREATE TABLE IF NOT EXISTS public.court_case_parties (
    id bigint(64) NOT NULL DEFAULT nextval('court_case_parties_id_seq'::regclass),
    case_id bigint(64) NOT NULL,
    contractor_id integer(32),
    person_id integer(32),
    project_id integer(32) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    role text NOT NULL,
    CONSTRAINT court_case_parties_case_id_fkey FOREIGN KEY (case_id) REFERENCES None.None(None),
    CONSTRAINT court_case_parties_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES None.None(None),
    CONSTRAINT court_case_parties_person_id_fkey FOREIGN KEY (person_id) REFERENCES None.None(None),
    CONSTRAINT court_case_parties_pkey PRIMARY KEY (id),
    CONSTRAINT court_case_parties_project_id_fkey FOREIGN KEY (project_id) REFERENCES None.None(None)
);

-- Table: public.court_case_units
CREATE TABLE IF NOT EXISTS public.court_case_units (
    court_case_id bigint(64) NOT NULL,
    unit_id integer(32) NOT NULL,
    CONSTRAINT court_case_units_court_case_id_fkey FOREIGN KEY (court_case_id) REFERENCES None.None(None),
    CONSTRAINT court_case_units_pkey PRIMARY KEY (court_case_id),
    CONSTRAINT court_case_units_pkey PRIMARY KEY (unit_id),
    CONSTRAINT court_case_units_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES None.None(None)
);

-- Table: public.court_cases
CREATE TABLE IF NOT EXISTS public.court_cases (
    id bigint(64) NOT NULL DEFAULT nextval('court_cases_id_seq'::regclass),
    project_id integer(32) NOT NULL,
    status integer(32) NOT NULL,
    responsible_lawyer_id uuid,
    fix_start_date date,
    fix_end_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    date date,
    number text,
    description text,
    case_uid_id integer(32),
    created_by uuid,
    total_claim_amount numeric,
    CONSTRAINT court_cases_case_uid_id_fkey FOREIGN KEY (case_uid_id) REFERENCES None.None(None),
    CONSTRAINT court_cases_created_by_fkey FOREIGN KEY (created_by) REFERENCES None.None(None),
    CONSTRAINT court_cases_pkey PRIMARY KEY (id),
    CONSTRAINT court_cases_project_id_fkey FOREIGN KEY (project_id) REFERENCES None.None(None),
    CONSTRAINT court_cases_responsible_lawyer_id_fkey FOREIGN KEY (responsible_lawyer_id) REFERENCES None.None(None),
    CONSTRAINT court_cases_status_fkey FOREIGN KEY (status) REFERENCES None.None(None)
);

-- Table: public.court_cases_uids
CREATE TABLE IF NOT EXISTS public.court_cases_uids (
    id integer(32) NOT NULL DEFAULT nextval('court_cases_uids_id_seq'::regclass),
    uid text NOT NULL,
    CONSTRAINT court_cases_uids_pkey PRIMARY KEY (id),
    CONSTRAINT court_cases_uids_uid_key UNIQUE (uid)
);

-- Table: public.defect_attachments
CREATE TABLE IF NOT EXISTS public.defect_attachments (
    defect_id bigint(64) NOT NULL,
    attachment_id integer(32) NOT NULL,
    CONSTRAINT defect_attachments_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES None.None(None),
    CONSTRAINT defect_attachments_defect_id_fkey FOREIGN KEY (defect_id) REFERENCES None.None(None),
    CONSTRAINT defect_attachments_pkey PRIMARY KEY (attachment_id),
    CONSTRAINT defect_attachments_pkey PRIMARY KEY (defect_id)
);

-- Table: public.defect_types
CREATE TABLE IF NOT EXISTS public.defect_types (
    id integer(32) NOT NULL DEFAULT nextval('defect_types_id_seq'::regclass),
    name text NOT NULL,
    CONSTRAINT ticket_types_pkey PRIMARY KEY (id)
);

-- Table: public.defects
CREATE TABLE IF NOT EXISTS public.defects (
    id bigint(64) NOT NULL DEFAULT nextval('defects_id_seq'::regclass),
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    type_id integer(32),
    status_id integer(32),
    received_at date,
    fixed_at date,
    brigade_id integer(32),
    contractor_id integer(32),
    fixed_by uuid,
    is_warranty boolean NOT NULL DEFAULT false,
    project_id integer(32) NOT NULL,
    unit_id integer(32),
    created_by uuid,
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    engineer_id uuid,
    CONSTRAINT defects_brigade_fk FOREIGN KEY (brigade_id) REFERENCES None.None(None),
    CONSTRAINT defects_contractor_fk FOREIGN KEY (contractor_id) REFERENCES None.None(None),
    CONSTRAINT defects_defect_status_id_fkey FOREIGN KEY (status_id) REFERENCES None.None(None),
    CONSTRAINT defects_defect_type_id_fkey FOREIGN KEY (type_id) REFERENCES None.None(None),
    CONSTRAINT defects_fixed_by_fkey FOREIGN KEY (fixed_by) REFERENCES None.None(None),
    CONSTRAINT defects_pkey PRIMARY KEY (id),
    CONSTRAINT fk_defects_brigade FOREIGN KEY (brigade_id) REFERENCES None.None(None),
    CONSTRAINT fk_defects_contractor FOREIGN KEY (contractor_id) REFERENCES None.None(None),
    CONSTRAINT fk_defects_created_by FOREIGN KEY (created_by) REFERENCES None.None(None),
    CONSTRAINT fk_defects_engineer FOREIGN KEY (engineer_id) REFERENCES None.None(None),
    CONSTRAINT fk_defects_fixed_by FOREIGN KEY (fixed_by) REFERENCES None.None(None),
    CONSTRAINT fk_defects_project FOREIGN KEY (project_id) REFERENCES None.None(None),
    CONSTRAINT fk_defects_status FOREIGN KEY (status_id) REFERENCES None.None(None),
    CONSTRAINT fk_defects_type FOREIGN KEY (type_id) REFERENCES None.None(None),
    CONSTRAINT fk_defects_unit FOREIGN KEY (unit_id) REFERENCES None.None(None),
    CONSTRAINT fk_defects_updated_by FOREIGN KEY (updated_by) REFERENCES None.None(None)
);

-- Table: public.document_folder_files
CREATE TABLE IF NOT EXISTS public.document_folder_files (
    id integer(32) NOT NULL DEFAULT nextval('document_folder_files_id_seq'::regclass),
    folder_id integer(32) NOT NULL,
    attachment_id integer(32) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT document_folder_files_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES None.None(None),
    CONSTRAINT document_folder_files_created_by_fkey FOREIGN KEY (created_by) REFERENCES None.None(None),
    CONSTRAINT document_folder_files_folder_id_attachment_id_key UNIQUE (attachment_id),
    CONSTRAINT document_folder_files_folder_id_attachment_id_key UNIQUE (folder_id),
    CONSTRAINT document_folder_files_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES None.None(None),
    CONSTRAINT document_folder_files_pkey PRIMARY KEY (id)
);

-- Table: public.document_folders
CREATE TABLE IF NOT EXISTS public.document_folders (
    id integer(32) NOT NULL DEFAULT nextval('document_folders_id_seq'::regclass),
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    project_id integer(32),
    CONSTRAINT document_folders_created_by_fkey FOREIGN KEY (created_by) REFERENCES None.None(None),
    CONSTRAINT document_folders_pkey PRIMARY KEY (id),
    CONSTRAINT document_folders_project_id_fkey FOREIGN KEY (project_id) REFERENCES None.None(None)
);
COMMENT ON COLUMN public.document_folders.project_id IS 'ID проекта, к которому принадлежит папка (может быть NULL для общих папок)';

-- Table: public.engineer_call_attachments
CREATE TABLE IF NOT EXISTS public.engineer_call_attachments (
    engineer_call_id uuid NOT NULL,
    attachment_id integer(32) NOT NULL,
    CONSTRAINT engineer_call_attachments_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES None.None(None),
    CONSTRAINT engineer_call_attachments_engineer_call_id_fkey FOREIGN KEY (engineer_call_id) REFERENCES None.None(None),
    CONSTRAINT engineer_call_attachments_pkey PRIMARY KEY (attachment_id),
    CONSTRAINT engineer_call_attachments_pkey PRIMARY KEY (engineer_call_id)
);

-- Table: public.engineer_calls
-- Description: Table for managing engineer service calls. Updated to remove unused contact and location fields.
CREATE TABLE IF NOT EXISTS public.engineer_calls (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id integer(32) NOT NULL,
    title text NOT NULL,
    description text,
    start_datetime timestamp with time zone NOT NULL,
    end_datetime timestamp with time zone NOT NULL,
    engineer_id uuid,
    unit_id integer(32),
    claim_id integer(32),
    status text DEFAULT 'scheduled'::text,
    notes text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT engineer_calls_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES None.None(None),
    CONSTRAINT engineer_calls_created_by_fkey FOREIGN KEY (created_by) REFERENCES None.None(None),
    CONSTRAINT engineer_calls_engineer_id_fkey FOREIGN KEY (engineer_id) REFERENCES None.None(None),
    CONSTRAINT engineer_calls_pkey PRIMARY KEY (id),
    CONSTRAINT engineer_calls_project_id_fkey FOREIGN KEY (project_id) REFERENCES None.None(None),
    CONSTRAINT engineer_calls_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES None.None(None)
);
COMMENT ON TABLE public.engineer_calls IS 'Table for managing engineer service calls. Updated to remove unused contact and location fields.';

-- Table: public.lawsuit_claim_types
CREATE TABLE IF NOT EXISTS public.lawsuit_claim_types (
    id bigint(64) NOT NULL DEFAULT nextval('lawsuit_claim_types_id_seq'::regclass),
    name text NOT NULL,
    CONSTRAINT lawsuit_claim_types_pkey PRIMARY KEY (id)
);

-- Table: public.letter_attachments
CREATE TABLE IF NOT EXISTS public.letter_attachments (
    letter_id bigint(64) NOT NULL,
    attachment_id integer(32) NOT NULL,
    CONSTRAINT letter_attachments_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES None.None(None),
    CONSTRAINT letter_attachments_letter_id_fkey FOREIGN KEY (letter_id) REFERENCES None.None(None),
    CONSTRAINT letter_attachments_pkey PRIMARY KEY (attachment_id),
    CONSTRAINT letter_attachments_pkey PRIMARY KEY (letter_id)
);

-- Table: public.letter_links
CREATE TABLE IF NOT EXISTS public.letter_links (
    parent_id bigint(64) NOT NULL,
    child_id bigint(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    id bigint(64) NOT NULL DEFAULT nextval('letter_links_id_seq'::regclass),
    CONSTRAINT letter_links_child_id_fkey FOREIGN KEY (child_id) REFERENCES None.None(None),
    CONSTRAINT letter_links_id_key UNIQUE (id),
    CONSTRAINT letter_links_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES None.None(None),
    CONSTRAINT letter_links_pkey PRIMARY KEY (child_id),
    CONSTRAINT letter_links_pkey PRIMARY KEY (parent_id)
);

-- Table: public.letter_types
CREATE TABLE IF NOT EXISTS public.letter_types (
    id bigint(64) NOT NULL DEFAULT nextval('letter_types_id_seq'::regclass),
    name text NOT NULL,
    CONSTRAINT letter_types_name_key UNIQUE (name),
    CONSTRAINT letter_types_pkey PRIMARY KEY (id)
);

-- Table: public.letter_units
CREATE TABLE IF NOT EXISTS public.letter_units (
    letter_id bigint(64) NOT NULL,
    unit_id integer(32) NOT NULL,
    CONSTRAINT letter_units_letter_id_fkey FOREIGN KEY (letter_id) REFERENCES None.None(None),
    CONSTRAINT letter_units_pkey PRIMARY KEY (letter_id),
    CONSTRAINT letter_units_pkey PRIMARY KEY (unit_id),
    CONSTRAINT letter_units_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES None.None(None)
);

-- Table: public.letters
CREATE TABLE IF NOT EXISTS public.letters (
    id bigint(64) NOT NULL DEFAULT nextval('letters_id_seq'::regclass),
    project_id integer(32) NOT NULL,
    number text NOT NULL,
    letter_type_id bigint(64) NOT NULL,
    letter_date date NOT NULL,
    subject text,
    created_at timestamp with time zone DEFAULT now(),
    responsible_user_id uuid,
    content text,
    status_id bigint(64),
    sender_person_id bigint(64),
    sender_contractor_id integer(32),
    receiver_person_id bigint(64),
    receiver_contractor_id integer(32),
    direction text NOT NULL DEFAULT 'incoming'::text,
    created_by uuid,
    CONSTRAINT letters_created_by_fkey FOREIGN KEY (created_by) REFERENCES None.None(None),
    CONSTRAINT letters_letter_type_id_fkey FOREIGN KEY (letter_type_id) REFERENCES None.None(None),
    CONSTRAINT letters_pkey PRIMARY KEY (id),
    CONSTRAINT letters_project_id_fkey FOREIGN KEY (project_id) REFERENCES None.None(None),
    CONSTRAINT letters_receiver_contractor_id_fkey FOREIGN KEY (receiver_contractor_id) REFERENCES None.None(None),
    CONSTRAINT letters_receiver_person_id_fkey FOREIGN KEY (receiver_person_id) REFERENCES None.None(None),
    CONSTRAINT letters_sender_contractor_id_fkey FOREIGN KEY (sender_contractor_id) REFERENCES None.None(None),
    CONSTRAINT letters_sender_person_id_fkey FOREIGN KEY (sender_person_id) REFERENCES None.None(None),
    CONSTRAINT letters_status_id_fkey FOREIGN KEY (status_id) REFERENCES None.None(None)
);

-- Table: public.persons
CREATE TABLE IF NOT EXISTS public.persons (
    id bigint(64) NOT NULL,
    full_name text NOT NULL,
    phone text,
    email text,
    passport_series text,
    passport_number text,
    description text,
    CONSTRAINT persons_pkey PRIMARY KEY (id)
);

-- Table: public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    name text,
    role text NOT NULL DEFAULT 'USER'::text,
    created_at timestamp with time zone DEFAULT now(),
    email text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES None.None(None),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_role_fkey FOREIGN KEY (role) REFERENCES None.None(None)
);
COMMENT ON COLUMN public.profiles.is_active IS 'Активна ли учетная запись пользователя';

-- Table: public.profiles_projects
CREATE TABLE IF NOT EXISTS public.profiles_projects (
    profile_id uuid NOT NULL,
    project_id integer(32) NOT NULL,
    CONSTRAINT profiles_projects_pkey PRIMARY KEY (profile_id),
    CONSTRAINT profiles_projects_pkey PRIMARY KEY (project_id),
    CONSTRAINT profiles_projects_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES None.None(None),
    CONSTRAINT profiles_projects_project_id_fkey FOREIGN KEY (project_id) REFERENCES None.None(None)
);

-- Table: public.projects
CREATE TABLE IF NOT EXISTS public.projects (
    id integer(32) NOT NULL DEFAULT nextval('projects_id_seq'::regclass),
    name text NOT NULL,
    CONSTRAINT projects_pkey PRIMARY KEY (id)
);

-- Table: public.role_permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_name text NOT NULL,
    pages jsonb NOT NULL DEFAULT '[]'::jsonb,
    edit_tables jsonb NOT NULL DEFAULT '[]'::jsonb,
    delete_tables jsonb NOT NULL DEFAULT '[]'::jsonb,
    only_assigned_project boolean NOT NULL DEFAULT false,
    can_lock_units boolean NOT NULL DEFAULT false,
    can_upload_documents boolean NOT NULL DEFAULT false,
    CONSTRAINT role_permissions_pkey PRIMARY KEY (role_name),
    CONSTRAINT role_permissions_role_name_fkey FOREIGN KEY (role_name) REFERENCES None.None(None)
);
COMMENT ON COLUMN public.role_permissions.can_upload_documents IS 'Разрешено ли роли загружать документы';

-- Table: public.roles
CREATE TABLE IF NOT EXISTS public.roles (
    id integer(32) NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
    name text NOT NULL,
    CONSTRAINT roles_name_key UNIQUE (name),
    CONSTRAINT roles_pkey PRIMARY KEY (id)
);

-- Table: public.statuses
CREATE TABLE IF NOT EXISTS public.statuses (
    id integer(32) NOT NULL,
    entity text NOT NULL,
    name text NOT NULL,
    color character varying(7),
    is_default boolean DEFAULT false,
    CONSTRAINT statuses_pkey PRIMARY KEY (id)
);
COMMENT ON COLUMN public.statuses.is_default IS 'Indicates if this status should be used as default when creating new records';

-- Table: public.system_settings
-- Description: Глобальные настройки системы
CREATE TABLE IF NOT EXISTS public.system_settings (
    id integer(32) NOT NULL DEFAULT nextval('system_settings_id_seq'::regclass),
    setting_key character varying(100) NOT NULL,
    setting_value text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    CONSTRAINT system_settings_pkey PRIMARY KEY (id),
    CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key),
    CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES None.None(None)
);
COMMENT ON TABLE public.system_settings IS 'Глобальные настройки системы';
COMMENT ON COLUMN public.system_settings.setting_key IS 'Ключ настройки (уникальный)';
COMMENT ON COLUMN public.system_settings.setting_value IS 'Значение настройки (строка)';

-- Table: public.unit_attachments
CREATE TABLE IF NOT EXISTS public.unit_attachments (
    unit_id integer(32) NOT NULL,
    attachment_id integer(32) NOT NULL,
    CONSTRAINT unit_attachments_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES None.None(None),
    CONSTRAINT unit_attachments_pkey PRIMARY KEY (attachment_id),
    CONSTRAINT unit_attachments_pkey PRIMARY KEY (unit_id),
    CONSTRAINT unit_attachments_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES None.None(None)
);

-- Table: public.unit_sort_orders
CREATE TABLE IF NOT EXISTS public.unit_sort_orders (
    id integer(32) NOT NULL DEFAULT nextval('unit_sort_orders_id_seq'::regclass),
    project_id integer(32) NOT NULL,
    building text,
    floor text NOT NULL,
    sort_direction text,
    CONSTRAINT unit_sort_orders_pkey PRIMARY KEY (id),
    CONSTRAINT unit_sort_orders_project_id_building_floor_key UNIQUE (building),
    CONSTRAINT unit_sort_orders_project_id_building_floor_key UNIQUE (floor),
    CONSTRAINT unit_sort_orders_project_id_building_floor_key UNIQUE (project_id)
);

-- Table: public.units
CREATE TABLE IF NOT EXISTS public.units (
    id integer(32) NOT NULL DEFAULT nextval('units_id_seq'::regclass),
    project_id integer(32),
    name text NOT NULL,
    building text,
    floor integer(32),
    person_id uuid,
    locked boolean NOT NULL DEFAULT false,
    CONSTRAINT fk_units_person_id FOREIGN KEY (person_id) REFERENCES None.None(None),
    CONSTRAINT units_pkey PRIMARY KEY (id),
    CONSTRAINT units_project_id_fkey FOREIGN KEY (project_id) REFERENCES None.None(None)
);


-- ============================================
-- VIEWS
-- ============================================

-- View: public.claims_summary
CREATE OR REPLACE VIEW public.claims_summary AS
 SELECT c.id,
    c.project_id,
    c.claim_status_id,
    c.claim_no,
    c.claimed_on,
    c.accepted_on,
    c.registered_on,
    c.resolved_on,
    c.engineer_id,
    c.description,
    c.created_at,
    c.created_by,
    c.updated_at,
    c.updated_by,
    c.case_uid_id,
    c.pre_trial_claim,
    c.owner,
    p.name AS project_name,
    s.name AS status_name,
    s.color AS status_color,
    prof.name AS engineer_name,
    prof.email AS engineer_email,
    creator.name AS created_by_name,
    cu.uid AS case_uid,
    ( SELECT count(*) AS count
           FROM claim_attachments ca
          WHERE (ca.claim_id = c.id)) AS attachments_count,
    ( SELECT count(*) AS count
           FROM claim_units cu_count
          WHERE (cu_count.claim_id = c.id)) AS units_count,
    ( SELECT count(*) AS count
           FROM claim_defects cd
          WHERE (cd.claim_id = c.id)) AS defects_count,
    (EXISTS ( SELECT 1
           FROM claim_links cl
          WHERE (cl.parent_id = c.id))) AS has_children,
    (EXISTS ( SELECT 1
           FROM claim_links cl
          WHERE (cl.child_id = c.id))) AS has_parent
   FROM (((((claims c
     LEFT JOIN projects p ON ((c.project_id = p.id)))
     LEFT JOIN statuses s ON (((c.claim_status_id = s.id) AND (s.entity = 'claim'::text))))
     LEFT JOIN profiles prof ON ((c.engineer_id = prof.id)))
     LEFT JOIN profiles creator ON ((c.created_by = creator.id)))
     LEFT JOIN court_cases_uids cu ON ((c.case_uid_id = cu.id)));

-- View: public.court_cases_summary
CREATE OR REPLACE VIEW public.court_cases_summary AS
 SELECT cc.id,
    cc.project_id,
    cc.status,
    cc.responsible_lawyer_id,
    cc.fix_start_date,
    cc.fix_end_date,
    cc.created_at,
    cc.updated_at,
    cc.date,
    cc.number,
    cc.description,
    cc.case_uid_id,
    cc.created_by,
    cc.total_claim_amount,
    p.name AS project_name,
    s.name AS status_name,
    s.color AS status_color,
    lawyer.name AS lawyer_name,
    lawyer.email AS lawyer_email,
    cu.uid AS case_uid,
    ( SELECT count(*) AS count
           FROM court_case_attachments cca
          WHERE (cca.court_case_id = cc.id)) AS attachments_count,
    ( SELECT count(*) AS count
           FROM court_case_units ccu
          WHERE (ccu.court_case_id = cc.id)) AS units_count,
    ( SELECT count(*) AS count
           FROM court_case_parties ccp
          WHERE (ccp.case_id = cc.id)) AS parties_count,
    ( SELECT count(*) AS count
           FROM court_case_claim_links cccl
          WHERE (cccl.case_id = cc.id)) AS claims_count
   FROM ((((court_cases cc
     LEFT JOIN projects p ON ((cc.project_id = p.id)))
     LEFT JOIN statuses s ON (((cc.status = s.id) AND (s.entity = 'court_case'::text))))
     LEFT JOIN profiles lawyer ON ((cc.responsible_lawyer_id = lawyer.id)))
     LEFT JOIN court_cases_uids cu ON ((cc.case_uid_id = cu.id)));

-- View: public.defects_summary
CREATE OR REPLACE VIEW public.defects_summary AS
 SELECT d.id,
    d.description,
    d.created_at,
    d.updated_at,
    d.type_id,
    d.status_id,
    d.received_at,
    d.fixed_at,
    d.brigade_id,
    d.contractor_id,
    d.fixed_by,
    d.is_warranty,
    d.project_id,
    d.unit_id,
    d.created_by,
    d.updated_by,
    d.engineer_id,
    p.name AS project_name,
    u.name AS unit_name,
    u.building AS unit_building,
    u.floor AS unit_floor,
    dt.name AS type_name,
    s.name AS status_name,
    s.color AS status_color,
    b.name AS brigade_name,
    cont.name AS contractor_name,
    eng.name AS engineer_name,
    fixed.name AS fixed_by_name,
    ( SELECT count(*) AS count
           FROM defect_attachments da
          WHERE (da.defect_id = d.id)) AS attachments_count
   FROM ((((((((defects d
     LEFT JOIN projects p ON ((d.project_id = p.id)))
     LEFT JOIN units u ON ((d.unit_id = u.id)))
     LEFT JOIN defect_types dt ON ((d.type_id = dt.id)))
     LEFT JOIN statuses s ON (((d.status_id = s.id) AND (s.entity = 'defect'::text))))
     LEFT JOIN brigades b ON ((d.brigade_id = b.id)))
     LEFT JOIN contractors cont ON ((d.contractor_id = cont.id)))
     LEFT JOIN profiles eng ON ((d.engineer_id = eng.id)))
     LEFT JOIN profiles fixed ON ((d.fixed_by = fixed.id)));


-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: public.batch_load_claim_defects
-- Description: Batch loading function for claim-defect relations
CREATE OR REPLACE FUNCTION public.batch_load_claim_defects(claim_ids integer[])
 RETURNS TABLE(claim_id integer, defect_id integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT cd.claim_id, cd.defect_id
    FROM claim_defects cd
    WHERE cd.claim_id = ANY(claim_ids)
    ORDER BY cd.claim_id, cd.defect_id;
END;
$function$


-- Function: public.batch_load_claim_units
-- Description: Batch loading function for claim-unit relations
CREATE OR REPLACE FUNCTION public.batch_load_claim_units(claim_ids integer[])
 RETURNS TABLE(claim_id integer, unit_id integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT cu.claim_id, cu.unit_id
    FROM claim_units cu
    WHERE cu.claim_id = ANY(claim_ids)
    ORDER BY cu.claim_id, cu.unit_id;
END;
$function$


-- Function: public.buildings_by_project
CREATE OR REPLACE FUNCTION public.buildings_by_project(pid integer)
 RETURNS TABLE(building text)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT DISTINCT building
  FROM units
  WHERE project_id = pid AND building IS NOT NULL
  ORDER BY building;
$function$


-- Function: public.dashboard_stats
CREATE OR REPLACE FUNCTION public.dashboard_stats(pid integer, closed_claim_id integer, closed_defect_id integer)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'projects', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'projectId', p.id,
                    'projectName', p.name,
                    'unitCount', COALESCE(u.cnt, 0),
                    'defectTotal', COALESCE(d.cnt, 0),
                    'letterCount', COALESCE(l.cnt, 0)
                )
            )
            FROM (
                SELECT id, name FROM projects WHERE id = pid
            ) p
            LEFT JOIN (
                SELECT project_id, COUNT(*) cnt FROM units GROUP BY project_id
            ) u ON u.project_id = p.id
            LEFT JOIN (
                SELECT project_id, COUNT(*) cnt FROM defects GROUP BY project_id
            ) d ON d.project_id = p.id
            LEFT JOIN (
                SELECT project_id, COUNT(*) cnt FROM letters GROUP BY project_id
            ) l ON l.project_id = p.id
        ),
        'claimsOpen', (
            SELECT COUNT(*) FROM claims
            WHERE project_id = pid AND (claim_status_id IS DISTINCT FROM closed_claim_id)
        ),
        'claimsClosed', (
            SELECT COUNT(*) FROM claims
            WHERE project_id = pid AND claim_status_id = closed_claim_id
        ),
        'defectsOpen', (
            SELECT COUNT(*) FROM defects
            WHERE project_id = pid AND (status_id IS DISTINCT FROM closed_defect_id)
        ),
        'defectsClosed', (
            SELECT COUNT(*) FROM defects
            WHERE project_id = pid AND status_id = closed_defect_id
        ),
        'courtCases', (
            SELECT COUNT(*) FROM court_cases WHERE project_id = pid
        ),
        'claimsByUnit', (
            SELECT jsonb_agg(
                jsonb_build_object('unitName', sub.name, 'count', sub.cnt)
                ORDER BY sub.cnt DESC
            )
            FROM (
                SELECT u.name, COUNT(*) cnt
                FROM claim_units cu
                JOIN units u ON u.id = cu.unit_id
                JOIN claims c ON c.id = cu.claim_id
                WHERE c.project_id = pid
                GROUP BY u.name
            ) sub
        ),
        'claimsByEngineer', (
            SELECT jsonb_agg(
                jsonb_build_object('engineerName', COALESCE(pr.name, '—'), 'count', agg.cnt)
                ORDER BY agg.cnt DESC
            )
            FROM (
                SELECT c.engineer_id, COUNT(*) cnt
                FROM claims c
                WHERE c.project_id = pid
                GROUP BY c.engineer_id
            ) agg
            LEFT JOIN profiles pr ON pr.id = agg.engineer_id
        ),
        'defectsByEngineer', (
            SELECT jsonb_agg(
                jsonb_build_object('engineerName', COALESCE(pr.name, '—'), 'count', agg.cnt)
                ORDER BY agg.cnt DESC
            )
            FROM (
                SELECT d.fixed_by AS engineer_id, COUNT(*) cnt
                FROM defects d
                WHERE d.project_id = pid
                GROUP BY d.fixed_by
            ) agg
            LEFT JOIN profiles pr ON pr.id = agg.engineer_id
        )
    ) INTO result;

    RETURN result;
END;
$function$


-- Function: public.dashboard_stats_optimized
-- Description: Optimized version of dashboard_stats using CTEs for better performance
CREATE OR REPLACE FUNCTION public.dashboard_stats_optimized(pid integer, closed_claim_id integer, closed_defect_id integer)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    result JSONB;
BEGIN
    -- Используем CTE для предварительного расчета всех агрегатов
    WITH project_data AS (
        SELECT id, name FROM projects WHERE id = pid
    ),
    unit_counts AS (
        SELECT COUNT(*) as cnt FROM units WHERE project_id = pid
    ),
    defect_counts AS (
        SELECT COUNT(*) as cnt FROM defects WHERE project_id = pid
    ),
    letter_counts AS (
        SELECT COUNT(*) as cnt FROM letters WHERE project_id = pid
    ),
    claim_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE claim_status_id IS DISTINCT FROM closed_claim_id) as open,
            COUNT(*) FILTER (WHERE claim_status_id = closed_claim_id) as closed
        FROM claims WHERE project_id = pid
    ),
    defect_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE status_id IS DISTINCT FROM closed_defect_id) as open,
            COUNT(*) FILTER (WHERE status_id = closed_defect_id) as closed
        FROM defects WHERE project_id = pid
    ),
    court_case_counts AS (
        SELECT COUNT(*) as cnt FROM court_cases WHERE project_id = pid
    ),
    claims_by_unit_data AS (
        SELECT u.name, COUNT(*) as cnt
        FROM claim_units cu
        JOIN units u ON u.id = cu.unit_id
        JOIN claims c ON c.id = cu.claim_id
        WHERE c.project_id = pid
        GROUP BY u.name
        ORDER BY cnt DESC
    ),
    claims_by_engineer_data AS (
        SELECT COALESCE(pr.name, '—') as engineer_name, COUNT(*) as cnt
        FROM claims c
        LEFT JOIN profiles pr ON pr.id = c.engineer_id
        WHERE c.project_id = pid
        GROUP BY pr.name
        ORDER BY cnt DESC
    ),
    defects_by_engineer_data AS (
        SELECT COALESCE(pr.name, '—') as engineer_name, COUNT(*) as cnt
        FROM defects d
        LEFT JOIN profiles pr ON pr.id = d.fixed_by
        WHERE d.project_id = pid
        GROUP BY pr.name
        ORDER BY cnt DESC
    )
    SELECT jsonb_build_object(
        'projects', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'projectId', pd.id,
                    'projectName', pd.name,
                    'unitCount', COALESCE(uc.cnt, 0),
                    'defectTotal', COALESCE(dc.cnt, 0),
                    'letterCount', COALESCE(lc.cnt, 0)
                )
            )
            FROM project_data pd
            CROSS JOIN unit_counts uc
            CROSS JOIN defect_counts dc
            CROSS JOIN letter_counts lc
        ),
        'claimsOpen', (SELECT open FROM claim_stats),
        'claimsClosed', (SELECT closed FROM claim_stats),
        'defectsOpen', (SELECT open FROM defect_stats),
        'defectsClosed', (SELECT closed FROM defect_stats),
        'courtCases', (SELECT cnt FROM court_case_counts),
        'claimsByUnit', (
            SELECT jsonb_agg(
                jsonb_build_object('unitName', name, 'count', cnt)
            ) FROM claims_by_unit_data
        ),
        'claimsByEngineer', (
            SELECT jsonb_agg(
                jsonb_build_object('engineerName', engineer_name, 'count', cnt)
            ) FROM claims_by_engineer_data
        ),
        'defectsByEngineer', (
            SELECT jsonb_agg(
                jsonb_build_object('engineerName', engineer_name, 'count', cnt)
            ) FROM defects_by_engineer_data
        )
    ) INTO result;

    RETURN result;
END;
$function$


-- Function: public.get_claims_with_relations
-- Description: Optimized function to fetch claims with relations, eliminates N+1 problem
CREATE OR REPLACE FUNCTION public.get_claims_with_relations(project_ids integer[] DEFAULT NULL::integer[], only_assigned boolean DEFAULT false)
 RETURNS TABLE(id integer, claim_no text, description text, created_at timestamp with time zone, claimed_on date, accepted_on date, registered_on date, resolved_on date, claim_status_id integer, engineer_id uuid, created_by uuid, project_id integer, case_uid_id integer, pre_trial_claim boolean, owner text, project_name text, status_name text, status_color text, engineer_name text, case_uid text, created_by_name text, unit_ids integer[], defect_ids integer[])
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH claims_base AS (
        SELECT 
            c.id, c.claim_no, c.description, c.created_at, c.claimed_on, c.accepted_on,
            c.registered_on, c.resolved_on, c.claim_status_id, c.engineer_id, c.created_by,
            c.project_id, c.case_uid_id, c.pre_trial_claim, c.owner,
            p.name as project_name, s.name as status_name, s.color as status_color,
            prof_eng.name as engineer_name, cu.uid as case_uid, prof_creator.name as created_by_name
        FROM claims c
        LEFT JOIN projects p ON c.project_id = p.id
        LEFT JOIN statuses s ON c.claim_status_id = s.id
        LEFT JOIN profiles prof_eng ON c.engineer_id = prof_eng.id
        LEFT JOIN court_cases_uids cu ON c.case_uid_id = cu.id
        LEFT JOIN profiles prof_creator ON c.created_by = prof_creator.id
        WHERE 
            (project_ids IS NULL OR c.project_id = ANY(project_ids))
            AND (NOT only_assigned OR c.engineer_id IS NOT NULL)
    ),
    claim_units_agg AS (
        SELECT cu.claim_id, array_agg(cu.unit_id ORDER BY cu.unit_id) as unit_ids
        FROM claim_units cu
        WHERE cu.claim_id IN (SELECT id FROM claims_base)
        GROUP BY cu.claim_id
    ),
    claim_defects_agg AS (
        SELECT cd.claim_id, array_agg(cd.defect_id ORDER BY cd.defect_id) as defect_ids
        FROM claim_defects cd
        WHERE cd.claim_id IN (SELECT id FROM claims_base)
        GROUP BY cd.claim_id
    )
    SELECT cb.*, 
           COALESCE(cua.unit_ids, ARRAY[]::INTEGER[]) as unit_ids,
           COALESCE(cda.defect_ids, ARRAY[]::INTEGER[]) as defect_ids
    FROM claims_base cb
    LEFT JOIN claim_units_agg cua ON cb.id = cua.claim_id
    LEFT JOIN claim_defects_agg cda ON cb.id = cda.claim_id
    ORDER BY cb.created_at DESC;
END;
$function$


-- Function: public.get_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_project_id integer)
 RETURNS TABLE(claims_total bigint, claims_open bigint, claims_resolved bigint, defects_total bigint, defects_fixed bigint, defects_open bigint, court_cases_total bigint, letters_total bigint, units_total bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        ps.claims_total,
        ps.claims_open,
        ps.claims_resolved,
        ps.defects_total,
        ps.defects_fixed,
        ps.defects_open,
        ps.court_cases_total,
        ps.letters_total,
        ps.units_total
    FROM project_statistics ps
    WHERE ps.project_id = p_project_id;
END;
$function$


-- Function: public.get_units_matrix
CREATE OR REPLACE FUNCTION public.get_units_matrix(p_project_id integer)
 RETURNS TABLE(unit_id integer, unit_name text, building text, floor integer, claims_count bigint, defects_count bigint, court_cases_count bigint, letters_count bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.building,
        u.floor,
        COALESCE(c_count.count, 0) as claims_count,
        COALESCE(d_count.count, 0) as defects_count,
        COALESCE(cc_count.count, 0) as court_cases_count,
        COALESCE(l_count.count, 0) as letters_count
    FROM units u
    LEFT JOIN (
        SELECT cu.unit_id, COUNT(*) as count
        FROM claim_units cu
        JOIN claims c ON cu.claim_id = c.id
        WHERE c.project_id = p_project_id
        GROUP BY cu.unit_id
    ) c_count ON u.id = c_count.unit_id
    LEFT JOIN (
        SELECT unit_id, COUNT(*) as count
        FROM defects
        WHERE project_id = p_project_id AND unit_id IS NOT NULL
        GROUP BY unit_id
    ) d_count ON u.id = d_count.unit_id
    LEFT JOIN (
        SELECT ccu.unit_id, COUNT(*) as count
        FROM court_case_units ccu
        JOIN court_cases cc ON ccu.court_case_id = cc.id
        WHERE cc.project_id = p_project_id
        GROUP BY ccu.unit_id
    ) cc_count ON u.id = cc_count.unit_id
    LEFT JOIN (
        SELECT lu.unit_id, COUNT(*) as count
        FROM letter_units lu
        JOIN letters l ON lu.letter_id = l.id
        WHERE l.project_id = p_project_id
        GROUP BY lu.unit_id
    ) l_count ON u.id = l_count.unit_id
    WHERE u.project_id = p_project_id
    ORDER BY u.building, u.floor, u.name;
END;
$function$


-- Function: public.get_user_stats_optimized
-- Description: Optimized function to fetch user statistics, eliminates N+1 problem
CREATE OR REPLACE FUNCTION public.get_user_stats_optimized(user_id uuid, from_date timestamp with time zone, to_date timestamp with time zone)
 RETURNS TABLE(claims_created integer, claims_responsible integer, defects_created integer, defects_responsible integer, court_cases_created integer, court_cases_responsible integer, claim_status_counts jsonb, defect_status_counts jsonb, claim_responsible_status_counts jsonb, defect_responsible_status_counts jsonb, court_case_status_counts jsonb, court_case_responsible_status_counts jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*)::INTEGER as claims_created,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'statusId', c.claim_status_id,
                        'statusName', s.name,
                        'count', 1
                    )
                ) FILTER (WHERE c.claim_status_id IS NOT NULL),
                '[]'::jsonb
            ) as claim_status_counts
        FROM claims c
        LEFT JOIN statuses s ON c.claim_status_id = s.id
        WHERE c.created_by = user_id
          AND c.created_at >= from_date
          AND c.created_at <= to_date
    ),
    stats_responsible AS (
        SELECT 
            COUNT(*)::INTEGER as claims_responsible,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'statusId', c.claim_status_id,
                        'statusName', s.name,
                        'count', 1
                    )
                ) FILTER (WHERE c.claim_status_id IS NOT NULL),
                '[]'::jsonb
            ) as claim_responsible_status_counts
        FROM claims c
        LEFT JOIN statuses s ON c.claim_status_id = s.id
        WHERE c.engineer_id = user_id
          AND c.created_at >= from_date
          AND c.created_at <= to_date
    ),
    defects_stats AS (
        SELECT 
            COUNT(*)::INTEGER as defects_created,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'statusId', d.status_id,
                        'statusName', s.name,
                        'count', 1
                    )
                ) FILTER (WHERE d.status_id IS NOT NULL),
                '[]'::jsonb
            ) as defect_status_counts
        FROM defects d
        LEFT JOIN statuses s ON d.status_id = s.id
        WHERE d.created_by = user_id
          AND d.created_at >= from_date
          AND d.created_at <= to_date
    ),
    defects_responsible AS (
        SELECT 
            COUNT(*)::INTEGER as defects_responsible,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'statusId', d.status_id,
                        'statusName', s.name,
                        'count', 1
                    )
                ) FILTER (WHERE d.status_id IS NOT NULL),
                '[]'::jsonb
            ) as defect_responsible_status_counts
        FROM defects d
        LEFT JOIN statuses s ON d.status_id = s.id
        WHERE d.engineer_id = user_id
          AND d.created_at >= from_date
          AND d.created_at <= to_date
    ),
    court_cases_stats AS (
        SELECT 
            COUNT(*)::INTEGER as court_cases_created,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'statusId', cc.status,
                        'statusName', ccs.name,
                        'count', 1
                    )
                ) FILTER (WHERE cc.status IS NOT NULL),
                '[]'::jsonb
            ) as court_case_status_counts
        FROM court_cases cc
        LEFT JOIN statuses ccs ON cc.status = ccs.id
        WHERE cc.created_by = user_id
          AND cc.created_at >= from_date
          AND cc.created_at <= to_date
    ),
    court_cases_responsible AS (
        SELECT 
            COUNT(*)::INTEGER as court_cases_responsible,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'statusId', cc.status,
                        'statusName', ccs.name,
                        'count', 1
                    )
                ) FILTER (WHERE cc.status IS NOT NULL),
                '[]'::jsonb
            ) as court_case_responsible_status_counts
        FROM court_cases cc
        LEFT JOIN statuses ccs ON cc.status = ccs.id
        WHERE cc.responsible_lawyer_id = user_id
          AND cc.created_at >= from_date
          AND cc.created_at <= to_date
    )
    SELECT 
        s.claims_created, sr.claims_responsible, ds.defects_created, dr.defects_responsible,
        cs.court_cases_created, cr.court_cases_responsible, s.claim_status_counts,
        ds.defect_status_counts, sr.claim_responsible_status_counts, dr.defect_responsible_status_counts,
        cs.court_case_status_counts, cr.court_case_responsible_status_counts
    FROM stats s
    CROSS JOIN stats_responsible sr
    CROSS JOIN defects_stats ds
    CROSS JOIN defects_responsible dr
    CROSS JOIN court_cases_stats cs
    CROSS JOIN court_cases_responsible cr;
END;
$function$


-- Function: public.handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  _project_ids integer[] := coalesce(
    array(select jsonb_array_elements_text(new.raw_user_meta_data->'project_ids')::int),
    array[]::integer[]
  );
  _role text := coalesce(new.raw_user_meta_data->>'role', 'USER');
  _name text := coalesce(new.raw_user_meta_data->>'name', '');
begin
  insert into public.profiles(id, email, name, role)
  values (new.id, new.email, _name, _role);

  if array_length(_project_ids, 1) > 0 then
    insert into public.profiles_projects(profile_id, project_id)
    select new.id, pid from unnest(_project_ids) as pid;
  end if;

  return new;
end;
$function$


-- Function: public.update_counter
CREATE OR REPLACE FUNCTION public.update_counter(p_entity_type character varying, p_entity_id bigint, p_counter_type character varying, p_delta integer DEFAULT 1)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO cached_counters (entity_type, entity_id, counter_type, counter_value)
    VALUES (p_entity_type, p_entity_id, p_counter_type, p_delta)
    ON CONFLICT (entity_type, entity_id, counter_type)
    DO UPDATE SET 
        counter_value = cached_counters.counter_value + p_delta,
        updated_at = NOW();
END;
$function$


-- Function: public.update_court_case_total_claim_amount
CREATE OR REPLACE FUNCTION public.update_court_case_total_claim_amount()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
  BEGIN
      IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
          UPDATE court_cases
          SET total_claim_amount = (
              SELECT COALESCE(SUM(claimed_amount), 0)
              FROM court_case_claims
              WHERE case_id = NEW.case_id
          )
          WHERE id = NEW.case_id;
          RETURN NEW;
      END IF;

      IF TG_OP = 'DELETE' THEN
          UPDATE court_cases
          SET total_claim_amount = (
              SELECT COALESCE(SUM(claimed_amount), 0)
              FROM court_case_claims
              WHERE case_id = OLD.case_id
          )
          WHERE id = OLD.case_id;
          RETURN OLD;
      END IF;

      RETURN NULL;
  END;
  $function$


-- Function: public.update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$



-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: trigger_update_court_case_total_claim_amount on public.court_case_claims
CREATE TRIGGER trigger_update_court_case_total_claim_amount AFTER INSERT OR DELETE OR UPDATE ON public.court_case_claims FOR EACH ROW EXECUTE FUNCTION update_court_case_total_claim_amount()

-- Trigger: update_engineer_calls_updated_at on public.engineer_calls
CREATE TRIGGER update_engineer_calls_updated_at BEFORE UPDATE ON public.engineer_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()


-- ============================================
-- INDEXES
-- ============================================

-- Index on public.attachments
CREATE INDEX idx_attachments_created_at ON public.attachments USING btree (created_at DESC);

-- Index on public.attachments
CREATE INDEX idx_attachments_uploaded_by ON public.attachments USING btree (uploaded_by) WHERE (uploaded_by IS NOT NULL);

-- Index on public.claim_attachments
CREATE INDEX idx_claim_attachments_attachment ON public.claim_attachments USING btree (attachment_id);

-- Index on public.claim_attachments
CREATE INDEX idx_claim_attachments_claim_id ON public.claim_attachments USING btree (claim_id);

-- Index on public.claim_attachments
CREATE INDEX idx_claim_attachments_covering ON public.claim_attachments USING btree (claim_id) INCLUDE (attachment_id);

-- Index on public.claim_defects
CREATE INDEX claim_defects_defect_idx ON public.claim_defects USING btree (defect_id);

-- Index on public.claim_defects
CREATE INDEX idx_claim_defects_claim ON public.claim_defects USING btree (claim_id);

-- Index on public.claim_defects
CREATE INDEX idx_claim_defects_covering ON public.claim_defects USING btree (claim_id) INCLUDE (defect_id);

-- Index on public.claim_defects
CREATE INDEX idx_claim_defects_defect_covering ON public.claim_defects USING btree (defect_id) INCLUDE (claim_id);

-- Index on public.claim_links
CREATE INDEX idx_claim_links_child ON public.claim_links USING btree (child_id);

-- Index on public.claim_links
CREATE INDEX idx_claim_links_child_covering ON public.claim_links USING btree (child_id) INCLUDE (parent_id);

-- Index on public.claim_links
CREATE INDEX idx_claim_links_parent ON public.claim_links USING btree (parent_id);

-- Index on public.claim_links
CREATE INDEX idx_claim_links_parent_covering ON public.claim_links USING btree (parent_id) INCLUDE (child_id);

-- Index on public.claim_units
CREATE INDEX idx_claim_units_claim ON public.claim_units USING btree (claim_id);

-- Index on public.claim_units
CREATE INDEX idx_claim_units_covering ON public.claim_units USING btree (claim_id) INCLUDE (unit_id);

-- Index on public.claim_units
CREATE INDEX idx_claim_units_unit ON public.claim_units USING btree (unit_id);

-- Index on public.claims
CREATE INDEX idx_claims_accepted_on ON public.claims USING btree (accepted_on DESC) WHERE (accepted_on IS NOT NULL);

-- Index on public.claims
CREATE INDEX idx_claims_claim_no ON public.claims USING btree (claim_no);

-- Index on public.claims
CREATE INDEX idx_claims_created_by ON public.claims USING btree (created_by) WHERE (created_by IS NOT NULL);

-- Index on public.claims
CREATE INDEX idx_claims_created_by_date_status ON public.claims USING btree (created_by, created_at DESC, claim_status_id) WHERE (created_by IS NOT NULL);

-- Index on public.claims
CREATE INDEX idx_claims_description_fts ON public.claims USING gin (to_tsvector('russian'::regconfig, description)) WHERE (description IS NOT NULL);

-- Index on public.claims
CREATE INDEX idx_claims_engineer_date_status ON public.claims USING btree (engineer_id, created_at DESC, claim_status_id) WHERE (engineer_id IS NOT NULL);

-- Index on public.claims
CREATE INDEX idx_claims_engineer_id ON public.claims USING btree (engineer_id) WHERE (engineer_id IS NOT NULL);

-- Index on public.claims
CREATE INDEX idx_claims_engineer_project ON public.claims USING btree (engineer_id, project_id) WHERE (engineer_id IS NOT NULL);

-- Index on public.claims
CREATE INDEX idx_claims_project_created ON public.claims USING btree (project_id, created_at DESC);

-- Index on public.claims
CREATE INDEX idx_claims_project_status_covering ON public.claims USING btree (project_id, claim_status_id) INCLUDE (created_at, registered_on, accepted_on);

-- Index on public.claims
CREATE INDEX idx_claims_project_status_date ON public.claims USING btree (project_id, claim_status_id, created_at DESC);

-- Index on public.claims
CREATE INDEX idx_claims_registered_on ON public.claims USING btree (registered_on DESC) WHERE (registered_on IS NOT NULL);

-- Index on public.claims
CREATE INDEX idx_claims_status_date ON public.claims USING btree (claim_status_id, created_at DESC) WHERE (claim_status_id IS NOT NULL);

-- Index on public.court_case_claim_links
CREATE INDEX idx_court_case_claim_links_case ON public.court_case_claim_links USING btree (case_id);

-- Index on public.court_case_claim_links
CREATE INDEX idx_court_case_claim_links_claim ON public.court_case_claim_links USING btree (claim_id);

-- Index on public.court_case_claim_links
CREATE INDEX idx_court_case_claim_links_covering ON public.court_case_claim_links USING btree (case_id) INCLUDE (claim_id);

-- Index on public.court_case_claims
CREATE INDEX idx_court_case_claims_case ON public.court_case_claims USING btree (case_id);

-- Index on public.court_case_claims
CREATE INDEX idx_court_case_claims_covering ON public.court_case_claims USING btree (case_id) INCLUDE (claim_type_id, claimed_amount);

-- Index on public.court_case_defects
CREATE INDEX idx_court_case_defects_case ON public.court_case_defects USING btree (case_id);

-- Index on public.court_case_defects
CREATE INDEX idx_court_case_defects_defect ON public.court_case_defects USING btree (defect_id);

-- Index on public.court_case_links
CREATE UNIQUE INDEX court_case_links_child_id_key ON public.court_case_links USING btree (child_id);

-- Index on public.court_case_parties
CREATE INDEX idx_court_case_parties_case ON public.court_case_parties USING btree (case_id);

-- Index on public.court_case_units
CREATE INDEX idx_court_case_units_case ON public.court_case_units USING btree (court_case_id);

-- Index on public.court_case_units
CREATE INDEX idx_court_case_units_covering ON public.court_case_units USING btree (court_case_id) INCLUDE (unit_id);

-- Index on public.court_case_units
CREATE INDEX idx_court_case_units_unit ON public.court_case_units USING btree (unit_id);

-- Index on public.court_cases
CREATE INDEX idx_court_cases_created_by ON public.court_cases USING btree (created_by) WHERE (created_by IS NOT NULL);

-- Index on public.court_cases
CREATE INDEX idx_court_cases_created_by_date_status ON public.court_cases USING btree (created_by, created_at DESC, status) WHERE (created_by IS NOT NULL);

-- Index on public.court_cases
CREATE INDEX idx_court_cases_date ON public.court_cases USING btree (date DESC) WHERE (date IS NOT NULL);

-- Index on public.court_cases
CREATE INDEX idx_court_cases_lawyer_date_status ON public.court_cases USING btree (responsible_lawyer_id, created_at DESC, status) WHERE (responsible_lawyer_id IS NOT NULL);

-- Index on public.court_cases
CREATE INDEX idx_court_cases_lawyer_project ON public.court_cases USING btree (responsible_lawyer_id, project_id) WHERE (responsible_lawyer_id IS NOT NULL);

-- Index on public.court_cases
CREATE INDEX idx_court_cases_project_date ON public.court_cases USING btree (project_id, created_at DESC);

-- Index on public.court_cases
CREATE INDEX idx_court_cases_project_new ON public.court_cases USING btree (project_id);

-- Index on public.court_cases
CREATE INDEX idx_court_cases_project_status ON public.court_cases USING btree (project_id, status);

-- Index on public.court_cases
CREATE INDEX idx_court_cases_responsible_lawyer ON public.court_cases USING btree (responsible_lawyer_id) WHERE (responsible_lawyer_id IS NOT NULL);

-- Index on public.court_cases
CREATE INDEX idx_court_cases_status_new ON public.court_cases USING btree (status);

-- Index on public.court_cases_uids
CREATE UNIQUE INDEX court_cases_uids_uid_key ON public.court_cases_uids USING btree (uid);

-- Index on public.defect_attachments
CREATE INDEX idx_defect_attachments_covering ON public.defect_attachments USING btree (defect_id) INCLUDE (attachment_id);

-- Index on public.defect_attachments
CREATE INDEX idx_defect_attachments_defect_id ON public.defect_attachments USING btree (defect_id);

-- Index on public.defect_attachments
CREATE INDEX idx_defect_attachments_file ON public.defect_attachments USING btree (attachment_id);

-- Index on public.defects
CREATE INDEX idx_defects_brigade_date ON public.defects USING btree (brigade_id, created_at DESC) WHERE (brigade_id IS NOT NULL);

-- Index on public.defects
CREATE INDEX idx_defects_created_by ON public.defects USING btree (created_by) WHERE (created_by IS NOT NULL);

-- Index on public.defects
CREATE INDEX idx_defects_created_by_date_status ON public.defects USING btree (created_by, created_at DESC, status_id) WHERE (created_by IS NOT NULL);

-- Index on public.defects
CREATE INDEX idx_defects_description_fts ON public.defects USING gin (to_tsvector('russian'::regconfig, description)) WHERE (description IS NOT NULL);

-- Index on public.defects
CREATE INDEX idx_defects_engineer ON public.defects USING btree (engineer_id);

-- Index on public.defects
CREATE INDEX idx_defects_engineer_date_status ON public.defects USING btree (engineer_id, created_at DESC, status_id) WHERE (engineer_id IS NOT NULL);

-- Index on public.defects
CREATE INDEX idx_defects_fixed_at ON public.defects USING btree (fixed_at DESC) WHERE (fixed_at IS NOT NULL);

-- Index on public.defects
CREATE INDEX idx_defects_project_status_covering ON public.defects USING btree (project_id, status_id) INCLUDE (created_at, fixed_at, received_at);

-- Index on public.defects
CREATE INDEX idx_defects_project_status_date ON public.defects USING btree (project_id, status_id, created_at DESC);

-- Index on public.defects
CREATE INDEX idx_defects_project_type ON public.defects USING btree (project_id, type_id) WHERE (type_id IS NOT NULL);

-- Index on public.defects
CREATE INDEX idx_defects_project_unit ON public.defects USING btree (project_id, unit_id) WHERE (unit_id IS NOT NULL);

-- Index on public.defects
CREATE INDEX idx_defects_received_at ON public.defects USING btree (received_at DESC) WHERE (received_at IS NOT NULL);

-- Index on public.defects
CREATE INDEX idx_defects_status_id ON public.defects USING btree (status_id) WHERE (status_id IS NOT NULL);

-- Index on public.defects
CREATE INDEX idx_defects_unit_status ON public.defects USING btree (unit_id, status_id) WHERE (unit_id IS NOT NULL);

-- Index on public.document_folder_files
CREATE UNIQUE INDEX document_folder_files_folder_id_attachment_id_key ON public.document_folder_files USING btree (folder_id, attachment_id);

-- Index on public.document_folder_files
CREATE INDEX idx_document_folder_files_attachment ON public.document_folder_files USING btree (attachment_id);

-- Index on public.document_folder_files
CREATE INDEX idx_document_folder_files_folder ON public.document_folder_files USING btree (folder_id);

-- Index on public.document_folders
CREATE INDEX idx_document_folders_name ON public.document_folders USING btree (name);

-- Index on public.document_folders
CREATE INDEX idx_document_folders_project ON public.document_folders USING btree (project_id);

-- Index on public.engineer_call_attachments
CREATE INDEX idx_engineer_call_attachments_attachment_id ON public.engineer_call_attachments USING btree (attachment_id);

-- Index on public.engineer_call_attachments
CREATE INDEX idx_engineer_call_attachments_call_id ON public.engineer_call_attachments USING btree (engineer_call_id);

-- Index on public.engineer_calls
CREATE INDEX idx_engineer_calls_engineer_id ON public.engineer_calls USING btree (engineer_id);

-- Index on public.engineer_calls
CREATE INDEX idx_engineer_calls_project_id ON public.engineer_calls USING btree (project_id);

-- Index on public.engineer_calls
CREATE INDEX idx_engineer_calls_start_datetime ON public.engineer_calls USING btree (start_datetime);

-- Index on public.engineer_calls
CREATE INDEX idx_engineer_calls_status ON public.engineer_calls USING btree (status);

-- Index on public.letter_attachments
CREATE INDEX idx_letter_attachments_attachment ON public.letter_attachments USING btree (attachment_id);

-- Index on public.letter_attachments
CREATE INDEX idx_letter_attachments_covering ON public.letter_attachments USING btree (letter_id) INCLUDE (attachment_id);

-- Index on public.letter_attachments
CREATE INDEX idx_letter_attachments_letter ON public.letter_attachments USING btree (letter_id);

-- Index on public.letter_links
CREATE INDEX idx_letter_links_child_covering ON public.letter_links USING btree (child_id) INCLUDE (parent_id);

-- Index on public.letter_links
CREATE INDEX idx_letter_links_parent ON public.letter_links USING btree (parent_id);

-- Index on public.letter_links
CREATE INDEX idx_letter_links_parent_covering ON public.letter_links USING btree (parent_id) INCLUDE (child_id);

-- Index on public.letter_links
CREATE UNIQUE INDEX letter_links_id_key ON public.letter_links USING btree (id);

-- Index on public.letter_types
CREATE UNIQUE INDEX letter_types_name_key ON public.letter_types USING btree (name);

-- Index on public.letter_units
CREATE INDEX idx_letter_units_covering ON public.letter_units USING btree (letter_id) INCLUDE (unit_id);

-- Index on public.letter_units
CREATE INDEX idx_letter_units_letter ON public.letter_units USING btree (letter_id);

-- Index on public.letter_units
CREATE INDEX idx_letter_units_unit ON public.letter_units USING btree (unit_id);

-- Index on public.letter_units
CREATE INDEX idx_letter_units_unit_covering ON public.letter_units USING btree (unit_id) INCLUDE (letter_id);

-- Index on public.letters
CREATE INDEX idx_letters_direction ON public.letters USING btree (direction) WHERE (direction IS NOT NULL);

-- Index on public.letters
CREATE INDEX idx_letters_number ON public.letters USING btree (number) WHERE (number IS NOT NULL);

-- Index on public.letters
CREATE INDEX idx_letters_project_date ON public.letters USING btree (project_id, letter_date DESC);

-- Index on public.letters
CREATE INDEX idx_letters_project_date_status ON public.letters USING btree (project_id, letter_date DESC, status_id) WHERE (status_id IS NOT NULL);

-- Index on public.letters
CREATE INDEX idx_letters_project_status ON public.letters USING btree (project_id, status_id) WHERE (status_id IS NOT NULL);

-- Index on public.letters
CREATE INDEX idx_letters_project_type ON public.letters USING btree (project_id, letter_type_id);

-- Index on public.letters
CREATE INDEX idx_letters_responsible_date ON public.letters USING btree (responsible_user_id, letter_date DESC) WHERE (responsible_user_id IS NOT NULL);

-- Index on public.letters
CREATE INDEX idx_letters_responsible_project ON public.letters USING btree (responsible_user_id, project_id) WHERE (responsible_user_id IS NOT NULL);

-- Index on public.letters
CREATE INDEX idx_letters_status ON public.letters USING btree (status_id) WHERE (status_id IS NOT NULL);

-- Index on public.persons
CREATE UNIQUE INDEX persons_passport_unique ON public.persons USING btree (passport_series, passport_number) WHERE ((passport_series IS NOT NULL) AND (passport_number IS NOT NULL));

-- Index on public.profiles
CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

-- Index on public.profiles
CREATE INDEX idx_profiles_id_name ON public.profiles USING btree (id, name);

-- Index on public.profiles
CREATE INDEX idx_profiles_role ON public.profiles USING btree (role) WHERE (role IS NOT NULL);

-- Index on public.profiles_projects
CREATE INDEX idx_profiles_projects_profile_covering ON public.profiles_projects USING btree (profile_id) INCLUDE (project_id);

-- Index on public.profiles_projects
CREATE INDEX idx_profiles_projects_project_covering ON public.profiles_projects USING btree (project_id) INCLUDE (profile_id);

-- Index on public.roles
CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);

-- Index on public.statuses
CREATE UNIQUE INDEX idx_statuses_default_unique ON public.statuses USING btree (entity, is_default) WHERE (is_default = true);

-- Index on public.statuses
CREATE INDEX idx_statuses_entity_id ON public.statuses USING btree (entity, id);

-- Index on public.system_settings
CREATE INDEX idx_system_settings_key ON public.system_settings USING btree (setting_key);

-- Index on public.system_settings
CREATE UNIQUE INDEX system_settings_setting_key_key ON public.system_settings USING btree (setting_key);

-- Index on public.unit_attachments
CREATE INDEX idx_unit_attachments_file ON public.unit_attachments USING btree (attachment_id);

-- Index on public.unit_attachments
CREATE INDEX idx_unit_attachments_unit_covering ON public.unit_attachments USING btree (unit_id) INCLUDE (attachment_id);

-- Index on public.unit_sort_orders
CREATE UNIQUE INDEX unit_sort_orders_project_id_building_floor_key ON public.unit_sort_orders USING btree (project_id, building, floor);

-- Index on public.units
CREATE INDEX idx_units_building ON public.units USING btree (building) WHERE (building IS NOT NULL);

-- Index on public.units
CREATE INDEX idx_units_floor ON public.units USING btree (floor) WHERE (floor IS NOT NULL);

-- Index on public.units
CREATE INDEX idx_units_name ON public.units USING btree (name);

-- Index on public.units
CREATE INDEX idx_units_project_building ON public.units USING btree (project_id, building);

-- Index on public.units
CREATE INDEX idx_units_project_building_floor ON public.units USING btree (project_id, building, floor) WHERE ((building IS NOT NULL) AND (floor IS NOT NULL));

-- Index on public.units
CREATE INDEX idx_units_project_floor ON public.units USING btree (project_id, floor) WHERE (floor IS NOT NULL);


-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Storage Bucket: attachments
-- Public: True
-- INSERT INTO storage.buckets (name, public, file_size_limit, allowed_mime_types)
-- VALUES ('attachments', True, None, 
--        NULL);
