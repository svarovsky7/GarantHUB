-- Database Schema Export
-- Generated: 2025-10-11T10:10:36.672050
-- Database: postgres
-- Host: aws-0-eu-central-1.pooler.supabase.com

-- ============================================

-- ENUM TYPES
-- ============================================

CREATE TYPE auth.aal_level AS ENUM ('aal1', 'aal2', 'aal3');
CREATE TYPE auth.code_challenge_method AS ENUM ('s256', 'plain');
CREATE TYPE auth.factor_status AS ENUM ('unverified', 'verified');
CREATE TYPE auth.factor_type AS ENUM ('totp', 'webauthn', 'phone');
CREATE TYPE auth.oauth_registration_type AS ENUM ('dynamic', 'manual');
CREATE TYPE auth.one_time_token_type AS ENUM ('confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token');
CREATE TYPE realtime.action AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR');
CREATE TYPE realtime.equality_op AS ENUM ('eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in');
CREATE TYPE storage.buckettype AS ENUM ('STANDARD', 'ANALYTICS');

-- TABLES
-- ============================================

-- Auth: Audit trail for user actions.
CREATE TABLE IF NOT EXISTS auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) NOT NULL DEFAULT ''::character varying,
    CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';

-- stores metadata for pkce logins
CREATE TABLE IF NOT EXISTS auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method USER-DEFINED NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    CONSTRAINT flow_state_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';

-- Auth: Stores identities associated to a user.
CREATE TABLE IF NOT EXISTS auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT identities_pkey PRIMARY KEY (id),
    CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider),
    CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id),
    CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES None.None(None)
);

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';
COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';

-- Auth: Manages users across multiple sites.
CREATE TABLE IF NOT EXISTS auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT instances_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';

-- auth: stores authenticator method reference claims for multi factor authentication
CREATE TABLE IF NOT EXISTS auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL,
    CONSTRAINT amr_id_pk PRIMARY KEY (id),
    CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (authentication_method),
    CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id),
    CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES None.None(None)
);

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';

-- auth: stores metadata about challenge requests made
CREATE TABLE IF NOT EXISTS auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb,
    CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES None.None(None),
    CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';

-- auth: stores metadata about factors
CREATE TABLE IF NOT EXISTS auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type USER-DEFINED NOT NULL,
    status USER-DEFINED NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at),
    CONSTRAINT mfa_factors_pkey PRIMARY KEY (id),
    CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES None.None(None)
);

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';

CREATE TABLE IF NOT EXISTS auth.oauth_clients (
    id uuid NOT NULL,
    client_id text NOT NULL,
    client_secret_hash text NOT NULL,
    registration_type USER-DEFINED NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT oauth_clients_client_id_key UNIQUE (client_id),
    CONSTRAINT oauth_clients_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type USER-DEFINED NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES None.None(None)
);

-- Auth: Store of tokens used to refresh JWT tokens once they expire.
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    instance_id uuid,
    id bigint(64) NOT NULL DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass),
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid,
    CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES None.None(None),
    CONSTRAINT refresh_tokens_token_unique UNIQUE (token)
);

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';

-- Auth: Manages SAML Identity Provider connections.
CREATE TABLE IF NOT EXISTS auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id),
    CONSTRAINT saml_providers_pkey PRIMARY KEY (id),
    CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES None.None(None)
);

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';

-- Auth: Contains SAML Relay State information for each Service Provider initiated login.
CREATE TABLE IF NOT EXISTS auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES None.None(None),
    CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id),
    CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES None.None(None)
);

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';

-- Auth: Manages updates to the auth system.
CREATE TABLE IF NOT EXISTS auth.schema_migrations (
    version character varying(255) NOT NULL
);

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';

-- Auth: Stores session data associated to a user.
CREATE TABLE IF NOT EXISTS auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal USER-DEFINED,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES None.None(None)
);

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';
COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';

-- Auth: Manages SSO email address domain mapping to an SSO Identity Provider.
CREATE TABLE IF NOT EXISTS auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT sso_domains_pkey PRIMARY KEY (id),
    CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES None.None(None)
);

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';

-- Auth: Manages SSO identity provider information; see saml_providers for SAML.
CREATE TABLE IF NOT EXISTS auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT sso_providers_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';
COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';

-- Auth: Stores user login data within a secure schema.
CREATE TABLE IF NOT EXISTS auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint(16) DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean NOT NULL DEFAULT false,
    deleted_at timestamp with time zone,
    is_anonymous boolean NOT NULL DEFAULT false,
    CONSTRAINT users_phone_key UNIQUE (phone),
    CONSTRAINT users_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';
COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';

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

CREATE TABLE IF NOT EXISTS public.brigades (
    id integer(32) NOT NULL DEFAULT nextval('brigades_id_seq'::regclass),
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT brigades_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.claim_attachments (
    claim_id bigint(64) NOT NULL,
    attachment_id integer(32) NOT NULL,
    CONSTRAINT claim_attachments_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES None.None(None),
    CONSTRAINT claim_attachments_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES None.None(None),
    CONSTRAINT claim_attachments_pkey PRIMARY KEY (attachment_id),
    CONSTRAINT claim_attachments_pkey PRIMARY KEY (claim_id)
);

CREATE TABLE IF NOT EXISTS public.claim_defects (
    claim_id bigint(64) NOT NULL,
    defect_id bigint(64) NOT NULL,
    pre_trial_claim boolean NOT NULL DEFAULT false,
    CONSTRAINT claim_defects_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES None.None(None),
    CONSTRAINT claim_defects_defect_id_fkey FOREIGN KEY (defect_id) REFERENCES None.None(None),
    CONSTRAINT claim_defects_pkey PRIMARY KEY (claim_id),
    CONSTRAINT claim_defects_pkey PRIMARY KEY (defect_id)
);

CREATE TABLE IF NOT EXISTS public.claim_links (
    id bigint(64) NOT NULL DEFAULT nextval('claim_links_id_seq'::regclass),
    parent_id bigint(64) NOT NULL,
    child_id bigint(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT claim_links_child_id_fkey FOREIGN KEY (child_id) REFERENCES None.None(None),
    CONSTRAINT claim_links_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES None.None(None),
    CONSTRAINT claim_links_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.claim_units (
    claim_id bigint(64) NOT NULL,
    unit_id integer(32) NOT NULL,
    CONSTRAINT claim_units_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES None.None(None),
    CONSTRAINT claim_units_pkey PRIMARY KEY (claim_id),
    CONSTRAINT claim_units_pkey PRIMARY KEY (unit_id),
    CONSTRAINT claim_units_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES None.None(None)
);

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

-- Связь между выполнениями и дефектами
CREATE TABLE IF NOT EXISTS public.completion_defects (
    id bigint(64) NOT NULL DEFAULT nextval('completion_defects_id_seq'::regclass),
    completion_id bigint(64) NOT NULL,
    defect_id bigint(64) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT completion_defects_completion_id_defect_id_key UNIQUE (completion_id),
    CONSTRAINT completion_defects_completion_id_defect_id_key UNIQUE (defect_id),
    CONSTRAINT completion_defects_completion_id_fkey FOREIGN KEY (completion_id) REFERENCES None.None(None),
    CONSTRAINT completion_defects_defect_id_fkey FOREIGN KEY (defect_id) REFERENCES None.None(None),
    CONSTRAINT completion_defects_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.completion_defects IS 'Связь между выполнениями и дефектами';

-- Выполнения работ по подрядчикам
CREATE TABLE IF NOT EXISTS public.contractor_completions (
    id bigint(64) NOT NULL DEFAULT nextval('contractor_completions_id_seq'::regclass),
    larix_number text NOT NULL,
    contractor_id bigint(64),
    project_id integer(32),
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT contractor_completions_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES None.None(None),
    CONSTRAINT contractor_completions_created_by_fkey FOREIGN KEY (created_by) REFERENCES None.None(None),
    CONSTRAINT contractor_completions_larix_number_key UNIQUE (larix_number),
    CONSTRAINT contractor_completions_pkey PRIMARY KEY (id),
    CONSTRAINT contractor_completions_project_id_fkey FOREIGN KEY (project_id) REFERENCES None.None(None)
);

COMMENT ON TABLE public.contractor_completions IS 'Выполнения работ по подрядчикам';
COMMENT ON COLUMN public.contractor_completions.larix_number IS 'Уникальный номер из системы Larix';
COMMENT ON COLUMN public.contractor_completions.contractor_id IS 'Подрядчик, выполнявший работы';
COMMENT ON COLUMN public.contractor_completions.project_id IS 'Проект, к которому относится выполнение';

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

CREATE TABLE IF NOT EXISTS public.court_case_attachments (
    court_case_id bigint(64) NOT NULL,
    attachment_id integer(32) NOT NULL,
    CONSTRAINT court_case_attachments_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES None.None(None),
    CONSTRAINT court_case_attachments_court_case_id_fkey FOREIGN KEY (court_case_id) REFERENCES None.None(None),
    CONSTRAINT court_case_attachments_pkey PRIMARY KEY (attachment_id),
    CONSTRAINT court_case_attachments_pkey PRIMARY KEY (court_case_id)
);

CREATE TABLE IF NOT EXISTS public.court_case_claim_links (
    id bigint(64) NOT NULL DEFAULT nextval('court_case_claim_links_id_seq'::regclass),
    case_id bigint(64) NOT NULL,
    claim_id bigint(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT court_case_claim_links_case_id_fkey FOREIGN KEY (case_id) REFERENCES None.None(None),
    CONSTRAINT court_case_claim_links_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES None.None(None),
    CONSTRAINT court_case_claim_links_pkey PRIMARY KEY (id)
);

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

CREATE TABLE IF NOT EXISTS public.court_case_defects (
    case_id bigint(64) NOT NULL,
    defect_id bigint(64) NOT NULL,
    CONSTRAINT court_case_defects_case_id_fkey FOREIGN KEY (case_id) REFERENCES None.None(None),
    CONSTRAINT court_case_defects_defect_id_fkey FOREIGN KEY (defect_id) REFERENCES None.None(None),
    CONSTRAINT court_case_defects_pkey PRIMARY KEY (case_id),
    CONSTRAINT court_case_defects_pkey PRIMARY KEY (defect_id)
);

CREATE TABLE IF NOT EXISTS public.court_case_links (
    id bigint(64) NOT NULL DEFAULT nextval('court_case_links_id_seq'::regclass),
    parent_id bigint(64) NOT NULL,
    child_id bigint(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT court_case_links_child_id_fkey FOREIGN KEY (child_id) REFERENCES None.None(None),
    CONSTRAINT court_case_links_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES None.None(None),
    CONSTRAINT court_case_links_pkey PRIMARY KEY (id)
);

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

CREATE TABLE IF NOT EXISTS public.court_case_units (
    court_case_id bigint(64) NOT NULL,
    unit_id integer(32) NOT NULL,
    CONSTRAINT court_case_units_court_case_id_fkey FOREIGN KEY (court_case_id) REFERENCES None.None(None),
    CONSTRAINT court_case_units_pkey PRIMARY KEY (court_case_id),
    CONSTRAINT court_case_units_pkey PRIMARY KEY (unit_id),
    CONSTRAINT court_case_units_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES None.None(None)
);

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

CREATE TABLE IF NOT EXISTS public.court_cases_uids (
    id integer(32) NOT NULL DEFAULT nextval('court_cases_uids_id_seq'::regclass),
    uid text NOT NULL,
    CONSTRAINT court_cases_uids_pkey PRIMARY KEY (id),
    CONSTRAINT court_cases_uids_uid_key UNIQUE (uid)
);

CREATE TABLE IF NOT EXISTS public.defect_attachments (
    defect_id bigint(64) NOT NULL,
    attachment_id integer(32) NOT NULL,
    CONSTRAINT defect_attachments_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES None.None(None),
    CONSTRAINT defect_attachments_defect_id_fkey FOREIGN KEY (defect_id) REFERENCES None.None(None),
    CONSTRAINT defect_attachments_pkey PRIMARY KEY (attachment_id),
    CONSTRAINT defect_attachments_pkey PRIMARY KEY (defect_id)
);

CREATE TABLE IF NOT EXISTS public.defect_types (
    id integer(32) NOT NULL DEFAULT nextval('defect_types_id_seq'::regclass),
    name text NOT NULL,
    CONSTRAINT ticket_types_pkey PRIMARY KEY (id)
);

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

CREATE TABLE IF NOT EXISTS public.engineer_call_attachments (
    engineer_call_id uuid NOT NULL,
    attachment_id integer(32) NOT NULL,
    CONSTRAINT engineer_call_attachments_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES None.None(None),
    CONSTRAINT engineer_call_attachments_engineer_call_id_fkey FOREIGN KEY (engineer_call_id) REFERENCES None.None(None),
    CONSTRAINT engineer_call_attachments_pkey PRIMARY KEY (attachment_id),
    CONSTRAINT engineer_call_attachments_pkey PRIMARY KEY (engineer_call_id)
);

-- Table for managing engineer service calls. Updated to remove unused contact and location fields.
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

CREATE TABLE IF NOT EXISTS public.lawsuit_claim_types (
    id bigint(64) NOT NULL DEFAULT nextval('lawsuit_claim_types_id_seq'::regclass),
    name text NOT NULL,
    CONSTRAINT lawsuit_claim_types_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.letter_attachments (
    letter_id bigint(64) NOT NULL,
    attachment_id integer(32) NOT NULL,
    CONSTRAINT letter_attachments_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES None.None(None),
    CONSTRAINT letter_attachments_letter_id_fkey FOREIGN KEY (letter_id) REFERENCES None.None(None),
    CONSTRAINT letter_attachments_pkey PRIMARY KEY (attachment_id),
    CONSTRAINT letter_attachments_pkey PRIMARY KEY (letter_id)
);

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

CREATE TABLE IF NOT EXISTS public.letter_types (
    id bigint(64) NOT NULL DEFAULT nextval('letter_types_id_seq'::regclass),
    name text NOT NULL,
    CONSTRAINT letter_types_name_key UNIQUE (name),
    CONSTRAINT letter_types_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.letter_units (
    letter_id bigint(64) NOT NULL,
    unit_id integer(32) NOT NULL,
    CONSTRAINT letter_units_letter_id_fkey FOREIGN KEY (letter_id) REFERENCES None.None(None),
    CONSTRAINT letter_units_pkey PRIMARY KEY (letter_id),
    CONSTRAINT letter_units_pkey PRIMARY KEY (unit_id),
    CONSTRAINT letter_units_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES None.None(None)
);

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

CREATE TABLE IF NOT EXISTS public.profiles_projects (
    profile_id uuid NOT NULL,
    project_id integer(32) NOT NULL,
    CONSTRAINT profiles_projects_pkey PRIMARY KEY (profile_id),
    CONSTRAINT profiles_projects_pkey PRIMARY KEY (project_id),
    CONSTRAINT profiles_projects_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES None.None(None),
    CONSTRAINT profiles_projects_project_id_fkey FOREIGN KEY (project_id) REFERENCES None.None(None)
);

CREATE TABLE IF NOT EXISTS public.projects (
    id integer(32) NOT NULL DEFAULT nextval('projects_id_seq'::regclass),
    name text NOT NULL,
    CONSTRAINT projects_pkey PRIMARY KEY (id)
);

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

CREATE TABLE IF NOT EXISTS public.roles (
    id integer(32) NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
    name text NOT NULL,
    CONSTRAINT roles_name_key UNIQUE (name),
    CONSTRAINT roles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.statuses (
    id integer(32) NOT NULL,
    entity text NOT NULL,
    name text NOT NULL,
    color character varying(7),
    is_default boolean DEFAULT false,
    CONSTRAINT statuses_pkey PRIMARY KEY (id)
);
COMMENT ON COLUMN public.statuses.is_default IS 'Indicates if this status should be used as default when creating new records';

-- Глобальные настройки системы
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

CREATE TABLE IF NOT EXISTS public.unit_attachments (
    unit_id integer(32) NOT NULL,
    attachment_id integer(32) NOT NULL,
    CONSTRAINT unit_attachments_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES None.None(None),
    CONSTRAINT unit_attachments_pkey PRIMARY KEY (attachment_id),
    CONSTRAINT unit_attachments_pkey PRIMARY KEY (unit_id),
    CONSTRAINT unit_attachments_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES None.None(None)
);

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

CREATE TABLE IF NOT EXISTS realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    inserted_at timestamp without time zone NOT NULL DEFAULT now(),
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT messages_pkey PRIMARY KEY (id),
    CONSTRAINT messages_pkey PRIMARY KEY (inserted_at)
);

CREATE TABLE IF NOT EXISTS realtime.messages_2025_10_08 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    inserted_at timestamp without time zone NOT NULL DEFAULT now(),
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT messages_2025_10_08_pkey PRIMARY KEY (id),
    CONSTRAINT messages_2025_10_08_pkey PRIMARY KEY (inserted_at)
);

CREATE TABLE IF NOT EXISTS realtime.messages_2025_10_09 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    inserted_at timestamp without time zone NOT NULL DEFAULT now(),
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT messages_2025_10_09_pkey PRIMARY KEY (id),
    CONSTRAINT messages_2025_10_09_pkey PRIMARY KEY (inserted_at)
);

CREATE TABLE IF NOT EXISTS realtime.messages_2025_10_10 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    inserted_at timestamp without time zone NOT NULL DEFAULT now(),
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT messages_2025_10_10_pkey PRIMARY KEY (id),
    CONSTRAINT messages_2025_10_10_pkey PRIMARY KEY (inserted_at)
);

CREATE TABLE IF NOT EXISTS realtime.messages_2025_10_11 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    inserted_at timestamp without time zone NOT NULL DEFAULT now(),
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT messages_2025_10_11_pkey PRIMARY KEY (id),
    CONSTRAINT messages_2025_10_11_pkey PRIMARY KEY (inserted_at)
);

CREATE TABLE IF NOT EXISTS realtime.messages_2025_10_12 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    inserted_at timestamp without time zone NOT NULL DEFAULT now(),
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT messages_2025_10_12_pkey PRIMARY KEY (id),
    CONSTRAINT messages_2025_10_12_pkey PRIMARY KEY (inserted_at)
);

CREATE TABLE IF NOT EXISTS realtime.messages_2025_10_13 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    inserted_at timestamp without time zone NOT NULL DEFAULT now(),
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT messages_2025_10_13_pkey PRIMARY KEY (id),
    CONSTRAINT messages_2025_10_13_pkey PRIMARY KEY (inserted_at)
);

CREATE TABLE IF NOT EXISTS realtime.messages_2025_10_14 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    inserted_at timestamp without time zone NOT NULL DEFAULT now(),
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT messages_2025_10_14_pkey PRIMARY KEY (id),
    CONSTRAINT messages_2025_10_14_pkey PRIMARY KEY (inserted_at)
);

-- Auth: Manages updates to the auth system.
CREATE TABLE IF NOT EXISTS realtime.schema_migrations (
    version bigint(64) NOT NULL,
    inserted_at timestamp without time zone,
    CONSTRAINT schema_migrations_pkey PRIMARY KEY (version)
);

COMMENT ON TABLE realtime.schema_migrations IS 'Auth: Manages updates to the auth system.';

CREATE TABLE IF NOT EXISTS realtime.subscription (
    id bigint(64) NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters ARRAY NOT NULL DEFAULT '{}'::realtime.user_defined_filter[],
    claims jsonb NOT NULL,
    claims_role regrole NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT pk_subscription PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint(64),
    allowed_mime_types ARRAY,
    owner_id text,
    type USER-DEFINED NOT NULL DEFAULT 'STANDARD'::storage.buckettype,
    CONSTRAINT buckets_pkey PRIMARY KEY (id)
);
COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';

CREATE TABLE IF NOT EXISTS storage.buckets_analytics (
    id text NOT NULL,
    type USER-DEFINED NOT NULL DEFAULT 'ANALYTICS'::storage.buckettype,
    format text NOT NULL DEFAULT 'ICEBERG'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS storage.migrations (
    id integer(32) NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens ARRAY,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer(32),
    CONSTRAINT objects_bucketId_fkey FOREIGN KEY (bucket_id) REFERENCES None.None(None),
    CONSTRAINT objects_pkey PRIMARY KEY (id)
);
COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';

CREATE TABLE IF NOT EXISTS storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL,
    level integer(32) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT prefixes_bucketId_fkey FOREIGN KEY (bucket_id) REFERENCES None.None(None),
    CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id),
    CONSTRAINT prefixes_pkey PRIMARY KEY (level),
    CONSTRAINT prefixes_pkey PRIMARY KEY (name)
);

CREATE TABLE IF NOT EXISTS storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint(64) NOT NULL DEFAULT 0,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL,
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    user_metadata jsonb,
    CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES None.None(None),
    CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS storage.s3_multipart_uploads_parts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    upload_id text NOT NULL,
    size bigint(64) NOT NULL DEFAULT 0,
    part_number integer(32) NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL,
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES None.None(None),
    CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id),
    CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES None.None(None)
);

-- Table with encrypted `secret` column for storing sensitive information on disk.
CREATE TABLE IF NOT EXISTS vault.secrets (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text,
    description text NOT NULL DEFAULT ''::text,
    secret text NOT NULL,
    key_id uuid,
    nonce bytea DEFAULT vault._crypto_aead_det_noncegen(),
    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT secrets_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE vault.secrets IS 'Table with encrypted `secret` column for storing sensitive information on disk.';


-- VIEWS
-- ============================================

CREATE OR REPLACE VIEW extensions.pg_stat_statements AS
 SELECT pg_stat_statements.userid,
    pg_stat_statements.dbid,
    pg_stat_statements.toplevel,
    pg_stat_statements.queryid,
    pg_stat_statements.query,
    pg_stat_statements.plans,
    pg_stat_statements.total_plan_time,
    pg_stat_statements.min_plan_time,
    pg_stat_statements.max_plan_time,
    pg_stat_statements.mean_plan_time,
    pg_stat_statements.stddev_plan_time,
    pg_stat_statements.calls,
    pg_stat_statements.total_exec_time,
    pg_stat_statements.min_exec_time,
    pg_stat_statements.max_exec_time,
    pg_stat_statements.mean_exec_time,
    pg_stat_statements.stddev_exec_time,
    pg_stat_statements.rows,
    pg_stat_statements.shared_blks_hit,
    pg_stat_statements.shared_blks_read,
    pg_stat_statements.shared_blks_dirtied,
    pg_stat_statements.shared_blks_written,
    pg_stat_statements.local_blks_hit,
    pg_stat_statements.local_blks_read,
    pg_stat_statements.local_blks_dirtied,
    pg_stat_statements.local_blks_written,
    pg_stat_statements.temp_blks_read,
    pg_stat_statements.temp_blks_written,
    pg_stat_statements.blk_read_time,
    pg_stat_statements.blk_write_time,
    pg_stat_statements.temp_blk_read_time,
    pg_stat_statements.temp_blk_write_time,
    pg_stat_statements.wal_records,
    pg_stat_statements.wal_fpi,
    pg_stat_statements.wal_bytes,
    pg_stat_statements.jit_functions,
    pg_stat_statements.jit_generation_time,
    pg_stat_statements.jit_inlining_count,
    pg_stat_statements.jit_inlining_time,
    pg_stat_statements.jit_optimization_count,
    pg_stat_statements.jit_optimization_time,
    pg_stat_statements.jit_emission_count,
    pg_stat_statements.jit_emission_time
   FROM pg_stat_statements(true) pg_stat_statements(userid, dbid, toplevel, queryid, query, plans, total_plan_time, min_plan_time, max_plan_time, mean_plan_time, stddev_plan_time, calls, total_exec_time, min_exec_time, max_exec_time, mean_exec_time, stddev_exec_time, rows, shared_blks_hit, shared_blks_read, shared_blks_dirtied, shared_blks_written, local_blks_hit, local_blks_read, local_blks_dirtied, local_blks_written, temp_blks_read, temp_blks_written, blk_read_time, blk_write_time, temp_blk_read_time, temp_blk_write_time, wal_records, wal_fpi, wal_bytes, jit_functions, jit_generation_time, jit_inlining_count, jit_inlining_time, jit_optimization_count, jit_optimization_time, jit_emission_count, jit_emission_time);

CREATE OR REPLACE VIEW extensions.pg_stat_statements_info AS
 SELECT pg_stat_statements_info.dealloc,
    pg_stat_statements_info.stats_reset
   FROM pg_stat_statements_info() pg_stat_statements_info(dealloc, stats_reset);

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
          WHERE (cl.child_id = c.id))) AS has_parent,
    COALESCE(( SELECT array_agg(DISTINCT cu2.unit_id ORDER BY cu2.unit_id) AS array_agg
           FROM claim_units cu2
          WHERE (cu2.claim_id = c.id)), '{}'::integer[]) AS unit_ids,
    COALESCE(( SELECT array_agg(DISTINCT cd2.defect_id ORDER BY cd2.defect_id) AS array_agg
           FROM claim_defects cd2
          WHERE (cd2.claim_id = c.id)), ('{}'::integer[])::bigint[]) AS defect_ids,
    COALESCE(( SELECT array_agg(DISTINCT u.name ORDER BY u.name) AS array_agg
           FROM (claim_units cu3
             JOIN units u ON ((u.id = cu3.unit_id)))
          WHERE ((cu3.claim_id = c.id) AND (u.name IS NOT NULL))), '{}'::text[]) AS unit_names,
    COALESCE(( SELECT array_agg(DISTINCT u.building ORDER BY u.building) AS array_agg
           FROM (claim_units cu4
             JOIN units u ON ((u.id = cu4.unit_id)))
          WHERE ((cu4.claim_id = c.id) AND (u.building IS NOT NULL))), '{}'::text[]) AS building_names,
    ( SELECT cl.parent_id
           FROM claim_links cl
          WHERE (cl.child_id = c.id)
         LIMIT 1) AS parent_id
   FROM (((((claims c
     LEFT JOIN projects p ON ((c.project_id = p.id)))
     LEFT JOIN statuses s ON (((c.claim_status_id = s.id) AND (s.entity = 'claim'::text))))
     LEFT JOIN profiles prof ON ((c.engineer_id = prof.id)))
     LEFT JOIN profiles creator ON ((c.created_by = creator.id)))
     LEFT JOIN court_cases_uids cu ON ((c.case_uid_id = cu.id)));

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
          WHERE (da.defect_id = d.id)) AS attachments_count,
    COALESCE(( SELECT array_agg(DISTINCT cd.claim_id ORDER BY cd.claim_id) AS array_agg
           FROM claim_defects cd
          WHERE (cd.defect_id = d.id)), ('{}'::integer[])::bigint[]) AS claim_ids,
    COALESCE(( SELECT array_agg(DISTINCT all_units.unit_id ORDER BY all_units.unit_id) AS array_agg
           FROM ( SELECT d.unit_id
                  WHERE (d.unit_id IS NOT NULL)
                UNION
                 SELECT cu.unit_id
                   FROM (claim_defects cd
                     JOIN claim_units cu ON ((cu.claim_id = cd.claim_id)))
                  WHERE ((cd.defect_id = d.id) AND (cu.unit_id IS NOT NULL))) all_units
          WHERE (all_units.unit_id IS NOT NULL)),
        CASE
            WHEN (d.unit_id IS NOT NULL) THEN ARRAY[d.unit_id]
            ELSE '{}'::integer[]
        END) AS unit_ids,
    COALESCE(( SELECT array_agg(DISTINCT u2.name ORDER BY u2.name) AS array_agg
           FROM (( SELECT d.unit_id
                  WHERE (d.unit_id IS NOT NULL)
                UNION
                 SELECT cu.unit_id
                   FROM (claim_defects cd
                     JOIN claim_units cu ON ((cu.claim_id = cd.claim_id)))
                  WHERE ((cd.defect_id = d.id) AND (cu.unit_id IS NOT NULL))) all_units
             JOIN units u2 ON ((u2.id = all_units.unit_id)))
          WHERE (u2.name IS NOT NULL)), '{}'::text[]) AS unit_names,
    COALESCE(( SELECT array_agg(DISTINCT u2.building ORDER BY u2.building) AS array_agg
           FROM (( SELECT d.unit_id
                  WHERE (d.unit_id IS NOT NULL)
                UNION
                 SELECT cu.unit_id
                   FROM (claim_defects cd
                     JOIN claim_units cu ON ((cu.claim_id = cd.claim_id)))
                  WHERE ((cd.defect_id = d.id) AND (cu.unit_id IS NOT NULL))) all_units
             JOIN units u2 ON ((u2.id = all_units.unit_id)))
          WHERE (u2.building IS NOT NULL)), '{}'::text[]) AS building_names,
    COALESCE(( SELECT array_agg(DISTINCT all_projects.project_id ORDER BY all_projects.project_id) AS array_agg
           FROM ( SELECT d.project_id
                  WHERE (d.project_id IS NOT NULL)
                UNION
                 SELECT c.project_id
                   FROM (claim_defects cd
                     JOIN claims c ON ((c.id = cd.claim_id)))
                  WHERE ((cd.defect_id = d.id) AND (c.project_id IS NOT NULL))) all_projects
          WHERE (all_projects.project_id IS NOT NULL)),
        CASE
            WHEN (d.project_id IS NOT NULL) THEN ARRAY[d.project_id]
            ELSE '{}'::integer[]
        END) AS project_ids,
    COALESCE(( SELECT array_agg(DISTINCT p2.name ORDER BY p2.name) AS array_agg
           FROM (( SELECT d.project_id
                  WHERE (d.project_id IS NOT NULL)
                UNION
                 SELECT c.project_id
                   FROM (claim_defects cd
                     JOIN claims c ON ((c.id = cd.claim_id)))
                  WHERE ((cd.defect_id = d.id) AND (c.project_id IS NOT NULL))) all_projects
             JOIN projects p2 ON ((p2.id = all_projects.project_id)))), '{}'::text[]) AS project_names,
    COALESCE(( SELECT bool_or(cd.pre_trial_claim) AS bool_or
           FROM claim_defects cd
          WHERE (cd.defect_id = d.id)), false) AS has_pretrial_claim,
    COALESCE(( SELECT (count(*) > 0)
           FROM completion_defects compd
          WHERE (compd.defect_id = d.id)), false) AS has_completion
   FROM ((((((((defects d
     LEFT JOIN projects p ON ((d.project_id = p.id)))
     LEFT JOIN units u ON ((d.unit_id = u.id)))
     LEFT JOIN defect_types dt ON ((d.type_id = dt.id)))
     LEFT JOIN statuses s ON (((d.status_id = s.id) AND (s.entity = 'defect'::text))))
     LEFT JOIN brigades b ON ((d.brigade_id = b.id)))
     LEFT JOIN contractors cont ON ((d.contractor_id = cont.id)))
     LEFT JOIN profiles eng ON ((d.engineer_id = eng.id)))
     LEFT JOIN profiles fixed ON ((d.fixed_by = fixed.id)));

CREATE OR REPLACE VIEW vault.decrypted_secrets AS
 SELECT s.id,
    s.name,
    s.description,
    s.secret,
    convert_from(vault._crypto_aead_det_decrypt(message => decode(s.secret, 'base64'::text), additional => convert_to((s.id)::text, 'utf8'::name), key_id => (0)::bigint, context => '\x7067736f6469756d'::bytea, nonce => s.nonce), 'utf8'::name) AS decrypted_secret,
    s.key_id,
    s.nonce,
    s.created_at,
    s.updated_at
   FROM vault.secrets s;


-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION auth.email()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$function$

;

CREATE OR REPLACE FUNCTION auth.jwt()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$function$

;

CREATE OR REPLACE FUNCTION auth.role()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$function$

;

CREATE OR REPLACE FUNCTION auth.uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$function$

;

CREATE OR REPLACE FUNCTION extensions.algorithm_sign(signables text, secret text, algorithm text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
WITH
  alg AS (
    SELECT CASE
      WHEN algorithm = 'HS256' THEN 'sha256'
      WHEN algorithm = 'HS384' THEN 'sha384'
      WHEN algorithm = 'HS512' THEN 'sha512'
      ELSE '' END AS id)  -- hmac throws error
SELECT extensions.url_encode(extensions.hmac(signables, secret, alg.id)) FROM alg;
$function$

;

CREATE OR REPLACE FUNCTION extensions.armor(bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_armor$function$

;

CREATE OR REPLACE FUNCTION extensions.armor(bytea, text[], text[])
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_armor$function$

;

CREATE OR REPLACE FUNCTION extensions.crypt(text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_crypt$function$

;

CREATE OR REPLACE FUNCTION extensions.dearmor(text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_dearmor$function$

;

CREATE OR REPLACE FUNCTION extensions.decrypt(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_decrypt$function$

;

CREATE OR REPLACE FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_decrypt_iv$function$

;

CREATE OR REPLACE FUNCTION extensions.digest(text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_digest$function$

;

CREATE OR REPLACE FUNCTION extensions.digest(bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_digest$function$

;

CREATE OR REPLACE FUNCTION extensions.encrypt(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_encrypt$function$

;

CREATE OR REPLACE FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_encrypt_iv$function$

;

CREATE OR REPLACE FUNCTION extensions.gen_random_bytes(integer)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_random_bytes$function$

;

CREATE OR REPLACE FUNCTION extensions.gen_random_uuid()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE
AS '$libdir/pgcrypto', $function$pg_random_uuid$function$

;

CREATE OR REPLACE FUNCTION extensions.gen_salt(text)
 RETURNS text
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_gen_salt$function$

;

CREATE OR REPLACE FUNCTION extensions.gen_salt(text, integer)
 RETURNS text
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_gen_salt_rounds$function$

;

CREATE OR REPLACE FUNCTION extensions.grant_pg_cron_access()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$function$

;

CREATE OR REPLACE FUNCTION extensions.grant_pg_graphql_access()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$function$

;

CREATE OR REPLACE FUNCTION extensions.grant_pg_net_access()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$function$

;

CREATE OR REPLACE FUNCTION extensions.hmac(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_hmac$function$

;

CREATE OR REPLACE FUNCTION extensions.hmac(text, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_hmac$function$

;

CREATE OR REPLACE FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision)
 RETURNS SETOF record
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pg_stat_statements', $function$pg_stat_statements_1_10$function$

;

CREATE OR REPLACE FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone)
 RETURNS record
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pg_stat_statements', $function$pg_stat_statements_info$function$

;

CREATE OR REPLACE FUNCTION extensions.pg_stat_statements_reset(userid oid DEFAULT 0, dbid oid DEFAULT 0, queryid bigint DEFAULT 0)
 RETURNS void
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pg_stat_statements', $function$pg_stat_statements_reset_1_7$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text)
 RETURNS SETOF record
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_armor_headers$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_key_id(bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_key_id_w$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt(text, bytea)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt(text, bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt(bytea, text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt(bytea, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt(text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt(text, text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$

;

CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$

;

CREATE OR REPLACE FUNCTION extensions.pgrst_ddl_watch()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $function$

;

CREATE OR REPLACE FUNCTION extensions.pgrst_drop_watch()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $function$

;

CREATE OR REPLACE FUNCTION extensions.set_graphql_placeholder()
 RETURNS event_trigger
 LANGUAGE plpgsql
AS $function$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$function$

;

CREATE OR REPLACE FUNCTION extensions.sign(payload json, secret text, algorithm text DEFAULT 'HS256'::text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
WITH
  header AS (
    SELECT extensions.url_encode(convert_to('{"alg":"' || algorithm || '","typ":"JWT"}', 'utf8')) AS data
    ),
  payload AS (
    SELECT extensions.url_encode(convert_to(payload::text, 'utf8')) AS data
    ),
  signables AS (
    SELECT header.data || '.' || payload.data AS data FROM header, payload
    )
SELECT
    signables.data || '.' ||
    extensions.algorithm_sign(signables.data, secret, algorithm) FROM signables;
$function$

;

CREATE OR REPLACE FUNCTION extensions.try_cast_double(inp text)
 RETURNS double precision
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
  BEGIN
    BEGIN
      RETURN inp::double precision;
    EXCEPTION
      WHEN OTHERS THEN RETURN NULL;
    END;
  END;
$function$

;

CREATE OR REPLACE FUNCTION extensions.url_decode(data text)
 RETURNS bytea
 LANGUAGE sql
 IMMUTABLE
AS $function$
WITH t AS (SELECT translate(data, '-_', '+/') AS trans),
     rem AS (SELECT length(t.trans) % 4 AS remainder FROM t) -- compute padding size
    SELECT decode(
        t.trans ||
        CASE WHEN rem.remainder > 0
           THEN repeat('=', (4 - rem.remainder))
           ELSE '' END,
    'base64') FROM t, rem;
$function$

;

CREATE OR REPLACE FUNCTION extensions.url_encode(data bytea)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
    SELECT translate(encode(data, 'base64'), E'+/=\n', '-_');
$function$

;

CREATE OR REPLACE FUNCTION extensions.uuid_generate_v1()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1$function$

;

CREATE OR REPLACE FUNCTION extensions.uuid_generate_v1mc()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1mc$function$

;

CREATE OR REPLACE FUNCTION extensions.uuid_generate_v3(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v3$function$

;

CREATE OR REPLACE FUNCTION extensions.uuid_generate_v4()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v4$function$

;

CREATE OR REPLACE FUNCTION extensions.uuid_generate_v5(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v5$function$

;

CREATE OR REPLACE FUNCTION extensions.uuid_nil()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_nil$function$

;

CREATE OR REPLACE FUNCTION extensions.uuid_ns_dns()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_dns$function$

;

CREATE OR REPLACE FUNCTION extensions.uuid_ns_oid()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_oid$function$

;

CREATE OR REPLACE FUNCTION extensions.uuid_ns_url()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_url$function$

;

CREATE OR REPLACE FUNCTION extensions.uuid_ns_x500()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_x500$function$

;

CREATE OR REPLACE FUNCTION extensions.verify(token text, secret text, algorithm text DEFAULT 'HS256'::text)
 RETURNS TABLE(header json, payload json, valid boolean)
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT
    jwt.header AS header,
    jwt.payload AS payload,
    jwt.signature_ok AND tstzrange(
      to_timestamp(extensions.try_cast_double(jwt.payload->>'nbf')),
      to_timestamp(extensions.try_cast_double(jwt.payload->>'exp'))
    ) @> CURRENT_TIMESTAMP AS valid
  FROM (
    SELECT
      convert_from(extensions.url_decode(r[1]), 'utf8')::json AS header,
      convert_from(extensions.url_decode(r[2]), 'utf8')::json AS payload,
      r[3] = extensions.algorithm_sign(r[1] || '.' || r[2], secret, algorithm) AS signature_ok
    FROM regexp_split_to_array(token, '\.') r
  ) jwt
$function$

;

CREATE OR REPLACE FUNCTION graphql._internal_resolve(query text, variables jsonb DEFAULT '{}'::jsonb, "operationName" text DEFAULT NULL::text, extensions jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE c
AS '$libdir/pg_graphql', $function$resolve_wrapper$function$

;

CREATE OR REPLACE FUNCTION graphql.comment_directive(comment_ text)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
AS $function$
    /*
    comment on column public.account.name is '@graphql.name: myField'
    */
    select
        coalesce(
            (
                regexp_match(
                    comment_,
                    '@graphql\((.+)\)'
                )
            )[1]::jsonb,
            jsonb_build_object()
        )
$function$

;

CREATE OR REPLACE FUNCTION graphql.exception(message text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
begin
    raise exception using errcode='22000', message=message;
end;
$function$

;

CREATE OR REPLACE FUNCTION graphql.get_schema_version()
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
    select last_value from graphql.seq_schema_version;
$function$

;

CREATE OR REPLACE FUNCTION graphql.increment_schema_version()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
    perform pg_catalog.nextval('graphql.seq_schema_version');
end;
$function$

;

CREATE OR REPLACE FUNCTION graphql.resolve(query text, variables jsonb DEFAULT '{}'::jsonb, "operationName" text DEFAULT NULL::text, extensions jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
declare
    res jsonb;
    message_text text;
begin
  begin
    select graphql._internal_resolve("query" := "query",
                                     "variables" := "variables",
                                     "operationName" := "operationName",
                                     "extensions" := "extensions") into res;
    return res;
  exception
    when others then
    get stacked diagnostics message_text = message_text;
    return
    jsonb_build_object('data', null,
                       'errors', jsonb_build_array(jsonb_build_object('message', message_text)));
  end;
end;
$function$

;

CREATE OR REPLACE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE sql
AS $function$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $function$

;

CREATE OR REPLACE FUNCTION pgbouncer.get_auth(p_usename text)
 RETURNS TABLE(username text, password text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $function$

;

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

;

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

;

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

;

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

;

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

;

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

;

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

;

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

;

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

;

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

;

CREATE OR REPLACE FUNCTION public.update_contractor_completions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$

;

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

;

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

;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$

;

CREATE OR REPLACE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024))
 RETURNS SETOF realtime.wal_rls
 LANGUAGE plpgsql
AS $function$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$function$

;

CREATE OR REPLACE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$function$

;

CREATE OR REPLACE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[])
 RETURNS text
 LANGUAGE sql
AS $function$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $function$

;

CREATE OR REPLACE FUNCTION realtime."cast"(val text, type_ regtype)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $function$

;

CREATE OR REPLACE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $function$

;

CREATE OR REPLACE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[])
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $function$

;

CREATE OR REPLACE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer)
 RETURNS SETOF realtime.wal_rls
 LANGUAGE sql
 SET log_min_messages TO 'fatal'
AS $function$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $function$

;

CREATE OR REPLACE FUNCTION realtime.quote_wal2json(entity regclass)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $function$

;

CREATE OR REPLACE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$function$

;

CREATE OR REPLACE FUNCTION realtime.subscription_check_filters()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $function$

;

CREATE OR REPLACE FUNCTION realtime.to_regrole(role_name text)
 RETURNS regrole
 LANGUAGE sql
 IMMUTABLE
AS $function$ select role_name::regrole $function$

;

CREATE OR REPLACE FUNCTION realtime.topic()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
select nullif(current_setting('realtime.topic', true), '')::text;
$function$

;

CREATE OR REPLACE FUNCTION storage.add_prefixes(_bucket_id text, _name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$function$

;

CREATE OR REPLACE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.delete_prefix(_bucket_id text, _name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.delete_prefix_hierarchy_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.enforce_bucket_name_length()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$function$

;

CREATE OR REPLACE FUNCTION storage.extension(name text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$function$

;

CREATE OR REPLACE FUNCTION storage.filename(name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$function$

;

CREATE OR REPLACE FUNCTION storage.foldername(name text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$function$

;

CREATE OR REPLACE FUNCTION storage.get_level(name text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$
SELECT array_length(string_to_array("name", '/'), 1);
$function$

;

CREATE OR REPLACE FUNCTION storage.get_prefix(name text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT
AS $function$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$function$

;

CREATE OR REPLACE FUNCTION storage.get_prefixes(name text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE STRICT
AS $function$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.get_size_by_bucket()
 RETURNS TABLE(size bigint, bucket_id text)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$function$

;

CREATE OR REPLACE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text)
 RETURNS TABLE(key text, id text, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text)
 RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.objects_delete_cleanup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.objects_insert_prefix_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.objects_update_cleanup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.objects_update_level_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.objects_update_prefix_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.operation()
 RETURNS text
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.prefixes_delete_cleanup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.prefixes_insert_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
AS $function$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$function$

;

CREATE OR REPLACE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$function$

;

CREATE OR REPLACE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$function$

;

CREATE OR REPLACE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text)
 RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$function$

;

CREATE OR REPLACE FUNCTION storage.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$function$

;

CREATE OR REPLACE FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea DEFAULT '\x7067736f6469756d'::bytea, nonce bytea DEFAULT NULL::bytea)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE
AS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_decrypt_by_id$function$

;

CREATE OR REPLACE FUNCTION vault._crypto_aead_det_encrypt(message bytea, additional bytea, key_id bigint, context bytea DEFAULT '\x7067736f6469756d'::bytea, nonce bytea DEFAULT NULL::bytea)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE
AS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_encrypt_by_id$function$

;

CREATE OR REPLACE FUNCTION vault._crypto_aead_det_noncegen()
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE
AS '$libdir/supabase_vault', $function$pgsodium_crypto_aead_det_noncegen$function$

;

CREATE OR REPLACE FUNCTION vault.create_secret(new_secret text, new_name text DEFAULT NULL::text, new_description text DEFAULT ''::text, new_key_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  rec record;
BEGIN
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (
    new_secret,
    new_name,
    new_description
  )
  RETURNING * INTO rec;
  UPDATE vault.secrets s
  SET secret = encode(vault._crypto_aead_det_encrypt(
    message := convert_to(rec.secret, 'utf8'),
    additional := convert_to(s.id::text, 'utf8'),
    key_id := 0,
    context := 'pgsodium'::bytea,
    nonce := rec.nonce
  ), 'base64')
  WHERE id = rec.id;
  RETURN rec.id;
END
$function$

;

CREATE OR REPLACE FUNCTION vault.update_secret(secret_id uuid, new_secret text DEFAULT NULL::text, new_name text DEFAULT NULL::text, new_description text DEFAULT NULL::text, new_key_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  decrypted_secret text := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = secret_id);
BEGIN
  UPDATE vault.secrets s
  SET
    secret = CASE WHEN new_secret IS NULL THEN s.secret
                  ELSE encode(vault._crypto_aead_det_encrypt(
                    message := convert_to(new_secret, 'utf8'),
                    additional := convert_to(s.id::text, 'utf8'),
                    key_id := 0,
                    context := 'pgsodium'::bytea,
                    nonce := s.nonce
                  ), 'base64') END,
    name = coalesce(new_name, s.name),
    description = coalesce(new_description, s.description),
    updated_at = now()
  WHERE s.id = secret_id;
END
$function$

;


-- TRIGGERS
-- ============================================

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user()
;

CREATE TRIGGER trigger_update_contractor_completions_updated_at BEFORE UPDATE ON public.contractor_completions FOR EACH ROW EXECUTE FUNCTION update_contractor_completions_updated_at()
;

CREATE TRIGGER trigger_update_court_case_total_claim_amount AFTER INSERT OR DELETE OR UPDATE ON public.court_case_claims FOR EACH ROW EXECUTE FUNCTION update_court_case_total_claim_amount()
;

CREATE TRIGGER update_engineer_calls_updated_at BEFORE UPDATE ON public.engineer_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
;

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters()
;

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length()
;

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger()
;

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger()
;

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger()
;

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column()
;

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger()
;

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger()
;


-- INDEXES
-- ============================================

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id)
;

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC)
;

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code)
;

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method)
;

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops)
;

CREATE UNIQUE INDEX identities_provider_id_provider_unique ON auth.identities USING btree (provider_id, provider)
;

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id)
;

CREATE UNIQUE INDEX amr_id_pk ON auth.mfa_amr_claims USING btree (id)
;

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC)
;

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at)
;

CREATE UNIQUE INDEX mfa_factors_last_challenged_at_key ON auth.mfa_factors USING btree (last_challenged_at)
;

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text)
;

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id)
;

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone)
;

CREATE INDEX oauth_clients_client_id_idx ON auth.oauth_clients USING btree (client_id)
;

CREATE UNIQUE INDEX oauth_clients_client_id_key ON auth.oauth_clients USING btree (client_id)
;

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at)
;

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to)
;

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash)
;

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type)
;

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id)
;

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id)
;

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent)
;

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked)
;

CREATE UNIQUE INDEX refresh_tokens_token_unique ON auth.refresh_tokens USING btree (token)
;

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC)
;

CREATE UNIQUE INDEX saml_providers_entity_id_key ON auth.saml_providers USING btree (entity_id)
;

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id)
;

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC)
;

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email)
;

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id)
;

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC)
;

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id)
;

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at)
;

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain))
;

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id)
;

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id))
;

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops)
;

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text)
;

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text)
;

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text)
;

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text)
;

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text)
;

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false)
;

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text))
;

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id)
;

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous)
;

CREATE UNIQUE INDEX users_phone_key ON auth.users USING btree (phone)
;

CREATE INDEX idx_attachments_created_at ON public.attachments USING btree (created_at DESC)
;

CREATE INDEX idx_attachments_uploaded_by ON public.attachments USING btree (uploaded_by) WHERE (uploaded_by IS NOT NULL)
;

CREATE INDEX idx_claim_attachments_attachment ON public.claim_attachments USING btree (attachment_id)
;

CREATE INDEX idx_claim_attachments_claim_id ON public.claim_attachments USING btree (claim_id)
;

CREATE INDEX idx_claim_attachments_covering ON public.claim_attachments USING btree (claim_id) INCLUDE (attachment_id)
;

CREATE INDEX claim_defects_defect_idx ON public.claim_defects USING btree (defect_id)
;

CREATE INDEX idx_claim_defects_claim ON public.claim_defects USING btree (claim_id)
;

CREATE INDEX idx_claim_defects_covering ON public.claim_defects USING btree (claim_id) INCLUDE (defect_id)
;

CREATE INDEX idx_claim_defects_defect_covering ON public.claim_defects USING btree (defect_id) INCLUDE (claim_id)
;

CREATE INDEX idx_claim_defects_defect_id ON public.claim_defects USING btree (defect_id) INCLUDE (claim_id, pre_trial_claim)
;

CREATE INDEX idx_claim_links_child ON public.claim_links USING btree (child_id)
;

CREATE INDEX idx_claim_links_child_covering ON public.claim_links USING btree (child_id) INCLUDE (parent_id)
;

CREATE INDEX idx_claim_links_parent ON public.claim_links USING btree (parent_id)
;

CREATE INDEX idx_claim_links_parent_covering ON public.claim_links USING btree (parent_id) INCLUDE (child_id)
;

CREATE INDEX idx_claim_units_claim ON public.claim_units USING btree (claim_id)
;

CREATE INDEX idx_claim_units_claim_id ON public.claim_units USING btree (claim_id) INCLUDE (unit_id)
;

CREATE INDEX idx_claim_units_covering ON public.claim_units USING btree (claim_id) INCLUDE (unit_id)
;

CREATE INDEX idx_claim_units_unit ON public.claim_units USING btree (unit_id)
;

CREATE INDEX idx_claims_accepted_on ON public.claims USING btree (accepted_on DESC) WHERE (accepted_on IS NOT NULL)
;

CREATE INDEX idx_claims_claim_no ON public.claims USING btree (claim_no)
;

CREATE INDEX idx_claims_created_by ON public.claims USING btree (created_by) WHERE (created_by IS NOT NULL)
;

CREATE INDEX idx_claims_created_by_date_status ON public.claims USING btree (created_by, created_at DESC, claim_status_id) WHERE (created_by IS NOT NULL)
;

CREATE INDEX idx_claims_description_fts ON public.claims USING gin (to_tsvector('russian'::regconfig, description)) WHERE (description IS NOT NULL)
;

CREATE INDEX idx_claims_engineer_date_status ON public.claims USING btree (engineer_id, created_at DESC, claim_status_id) WHERE (engineer_id IS NOT NULL)
;

CREATE INDEX idx_claims_engineer_id ON public.claims USING btree (engineer_id) WHERE (engineer_id IS NOT NULL)
;

CREATE INDEX idx_claims_engineer_project ON public.claims USING btree (engineer_id, project_id) WHERE (engineer_id IS NOT NULL)
;

CREATE INDEX idx_claims_id_project ON public.claims USING btree (id) INCLUDE (project_id)
;

CREATE INDEX idx_claims_project_created ON public.claims USING btree (project_id, created_at DESC)
;

CREATE INDEX idx_claims_project_status_covering ON public.claims USING btree (project_id, claim_status_id) INCLUDE (created_at, registered_on, accepted_on)
;

CREATE INDEX idx_claims_project_status_date ON public.claims USING btree (project_id, claim_status_id, created_at DESC)
;

CREATE INDEX idx_claims_registered_on ON public.claims USING btree (registered_on DESC) WHERE (registered_on IS NOT NULL)
;

CREATE INDEX idx_claims_status_date ON public.claims USING btree (claim_status_id, created_at DESC) WHERE (claim_status_id IS NOT NULL)
;

CREATE UNIQUE INDEX completion_defects_completion_id_defect_id_key ON public.completion_defects USING btree (completion_id, defect_id)
;

CREATE INDEX idx_completion_defects_completion ON public.completion_defects USING btree (completion_id)
;

CREATE INDEX idx_completion_defects_defect ON public.completion_defects USING btree (defect_id)
;

CREATE UNIQUE INDEX contractor_completions_larix_number_key ON public.contractor_completions USING btree (larix_number)
;

CREATE INDEX idx_contractor_completions_contractor ON public.contractor_completions USING btree (contractor_id)
;

CREATE INDEX idx_contractor_completions_created_by ON public.contractor_completions USING btree (created_by)
;

CREATE INDEX idx_contractor_completions_project ON public.contractor_completions USING btree (project_id)
;

CREATE INDEX idx_court_case_claim_links_case ON public.court_case_claim_links USING btree (case_id)
;

CREATE INDEX idx_court_case_claim_links_claim ON public.court_case_claim_links USING btree (claim_id)
;

CREATE INDEX idx_court_case_claim_links_covering ON public.court_case_claim_links USING btree (case_id) INCLUDE (claim_id)
;

CREATE INDEX idx_court_case_claims_case ON public.court_case_claims USING btree (case_id)
;

CREATE INDEX idx_court_case_claims_covering ON public.court_case_claims USING btree (case_id) INCLUDE (claim_type_id, claimed_amount)
;

CREATE INDEX idx_court_case_defects_case ON public.court_case_defects USING btree (case_id)
;

CREATE INDEX idx_court_case_defects_defect ON public.court_case_defects USING btree (defect_id)
;

CREATE UNIQUE INDEX court_case_links_child_id_key ON public.court_case_links USING btree (child_id)
;

CREATE INDEX idx_court_case_parties_case ON public.court_case_parties USING btree (case_id)
;

CREATE INDEX idx_court_case_units_case ON public.court_case_units USING btree (court_case_id)
;

CREATE INDEX idx_court_case_units_covering ON public.court_case_units USING btree (court_case_id) INCLUDE (unit_id)
;

CREATE INDEX idx_court_case_units_unit ON public.court_case_units USING btree (unit_id)
;

CREATE INDEX idx_court_cases_created_by ON public.court_cases USING btree (created_by) WHERE (created_by IS NOT NULL)
;

CREATE INDEX idx_court_cases_created_by_date_status ON public.court_cases USING btree (created_by, created_at DESC, status) WHERE (created_by IS NOT NULL)
;

CREATE INDEX idx_court_cases_date ON public.court_cases USING btree (date DESC) WHERE (date IS NOT NULL)
;

CREATE INDEX idx_court_cases_lawyer_date_status ON public.court_cases USING btree (responsible_lawyer_id, created_at DESC, status) WHERE (responsible_lawyer_id IS NOT NULL)
;

CREATE INDEX idx_court_cases_lawyer_project ON public.court_cases USING btree (responsible_lawyer_id, project_id) WHERE (responsible_lawyer_id IS NOT NULL)
;

CREATE INDEX idx_court_cases_project_date ON public.court_cases USING btree (project_id, created_at DESC)
;

CREATE INDEX idx_court_cases_project_new ON public.court_cases USING btree (project_id)
;

CREATE INDEX idx_court_cases_project_status ON public.court_cases USING btree (project_id, status)
;

CREATE INDEX idx_court_cases_responsible_lawyer ON public.court_cases USING btree (responsible_lawyer_id) WHERE (responsible_lawyer_id IS NOT NULL)
;

CREATE INDEX idx_court_cases_status_new ON public.court_cases USING btree (status)
;

CREATE UNIQUE INDEX court_cases_uids_uid_key ON public.court_cases_uids USING btree (uid)
;

CREATE INDEX idx_defect_attachments_covering ON public.defect_attachments USING btree (defect_id) INCLUDE (attachment_id)
;

CREATE INDEX idx_defect_attachments_defect_id ON public.defect_attachments USING btree (defect_id)
;

CREATE INDEX idx_defect_attachments_file ON public.defect_attachments USING btree (attachment_id)
;

CREATE INDEX idx_defects_brigade_date ON public.defects USING btree (brigade_id, created_at DESC) WHERE (brigade_id IS NOT NULL)
;

CREATE INDEX idx_defects_created_by ON public.defects USING btree (created_by) WHERE (created_by IS NOT NULL)
;

CREATE INDEX idx_defects_created_by_date_status ON public.defects USING btree (created_by, created_at DESC, status_id) WHERE (created_by IS NOT NULL)
;

CREATE INDEX idx_defects_description_fts ON public.defects USING gin (to_tsvector('russian'::regconfig, description)) WHERE (description IS NOT NULL)
;

CREATE INDEX idx_defects_engineer ON public.defects USING btree (engineer_id)
;

CREATE INDEX idx_defects_engineer_date_status ON public.defects USING btree (engineer_id, created_at DESC, status_id) WHERE (engineer_id IS NOT NULL)
;

CREATE INDEX idx_defects_fixed_at ON public.defects USING btree (fixed_at DESC) WHERE (fixed_at IS NOT NULL)
;

CREATE INDEX idx_defects_project_status_covering ON public.defects USING btree (project_id, status_id) INCLUDE (created_at, fixed_at, received_at)
;

CREATE INDEX idx_defects_project_status_date ON public.defects USING btree (project_id, status_id, created_at DESC)
;

CREATE INDEX idx_defects_project_type ON public.defects USING btree (project_id, type_id) WHERE (type_id IS NOT NULL)
;

CREATE INDEX idx_defects_project_unit ON public.defects USING btree (project_id, unit_id) WHERE (unit_id IS NOT NULL)
;

CREATE INDEX idx_defects_received_at ON public.defects USING btree (received_at DESC) WHERE (received_at IS NOT NULL)
;

CREATE INDEX idx_defects_status_id ON public.defects USING btree (status_id) WHERE (status_id IS NOT NULL)
;

CREATE INDEX idx_defects_unit_status ON public.defects USING btree (unit_id, status_id) WHERE (unit_id IS NOT NULL)
;

CREATE UNIQUE INDEX document_folder_files_folder_id_attachment_id_key ON public.document_folder_files USING btree (folder_id, attachment_id)
;

CREATE INDEX idx_document_folder_files_attachment ON public.document_folder_files USING btree (attachment_id)
;

CREATE INDEX idx_document_folder_files_folder ON public.document_folder_files USING btree (folder_id)
;

CREATE INDEX idx_document_folders_name ON public.document_folders USING btree (name)
;

CREATE INDEX idx_document_folders_project ON public.document_folders USING btree (project_id)
;

CREATE INDEX idx_engineer_call_attachments_attachment_id ON public.engineer_call_attachments USING btree (attachment_id)
;

CREATE INDEX idx_engineer_call_attachments_call_id ON public.engineer_call_attachments USING btree (engineer_call_id)
;

CREATE INDEX idx_engineer_calls_engineer_id ON public.engineer_calls USING btree (engineer_id)
;

CREATE INDEX idx_engineer_calls_project_id ON public.engineer_calls USING btree (project_id)
;

CREATE INDEX idx_engineer_calls_start_datetime ON public.engineer_calls USING btree (start_datetime)
;

CREATE INDEX idx_engineer_calls_status ON public.engineer_calls USING btree (status)
;

CREATE INDEX idx_letter_attachments_attachment ON public.letter_attachments USING btree (attachment_id)
;

CREATE INDEX idx_letter_attachments_covering ON public.letter_attachments USING btree (letter_id) INCLUDE (attachment_id)
;

CREATE INDEX idx_letter_attachments_letter ON public.letter_attachments USING btree (letter_id)
;

CREATE INDEX idx_letter_links_child_covering ON public.letter_links USING btree (child_id) INCLUDE (parent_id)
;

CREATE INDEX idx_letter_links_parent ON public.letter_links USING btree (parent_id)
;

CREATE INDEX idx_letter_links_parent_covering ON public.letter_links USING btree (parent_id) INCLUDE (child_id)
;

CREATE UNIQUE INDEX letter_links_id_key ON public.letter_links USING btree (id)
;

CREATE UNIQUE INDEX letter_types_name_key ON public.letter_types USING btree (name)
;

CREATE INDEX idx_letter_units_covering ON public.letter_units USING btree (letter_id) INCLUDE (unit_id)
;

CREATE INDEX idx_letter_units_letter ON public.letter_units USING btree (letter_id)
;

CREATE INDEX idx_letter_units_unit ON public.letter_units USING btree (unit_id)
;

CREATE INDEX idx_letter_units_unit_covering ON public.letter_units USING btree (unit_id) INCLUDE (letter_id)
;

CREATE INDEX idx_letters_direction ON public.letters USING btree (direction) WHERE (direction IS NOT NULL)
;

CREATE INDEX idx_letters_number ON public.letters USING btree (number) WHERE (number IS NOT NULL)
;

CREATE INDEX idx_letters_project_date ON public.letters USING btree (project_id, letter_date DESC)
;

CREATE INDEX idx_letters_project_date_status ON public.letters USING btree (project_id, letter_date DESC, status_id) WHERE (status_id IS NOT NULL)
;

CREATE INDEX idx_letters_project_status ON public.letters USING btree (project_id, status_id) WHERE (status_id IS NOT NULL)
;

CREATE INDEX idx_letters_project_type ON public.letters USING btree (project_id, letter_type_id)
;

CREATE INDEX idx_letters_responsible_date ON public.letters USING btree (responsible_user_id, letter_date DESC) WHERE (responsible_user_id IS NOT NULL)
;

CREATE INDEX idx_letters_responsible_project ON public.letters USING btree (responsible_user_id, project_id) WHERE (responsible_user_id IS NOT NULL)
;

CREATE INDEX idx_letters_status ON public.letters USING btree (status_id) WHERE (status_id IS NOT NULL)
;

CREATE UNIQUE INDEX persons_passport_unique ON public.persons USING btree (passport_series, passport_number) WHERE ((passport_series IS NOT NULL) AND (passport_number IS NOT NULL))
;

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email)
;

CREATE INDEX idx_profiles_id_name ON public.profiles USING btree (id, name)
;

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role) WHERE (role IS NOT NULL)
;

CREATE INDEX idx_profiles_projects_profile_covering ON public.profiles_projects USING btree (profile_id) INCLUDE (project_id)
;

CREATE INDEX idx_profiles_projects_project_covering ON public.profiles_projects USING btree (project_id) INCLUDE (profile_id)
;

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name)
;

CREATE UNIQUE INDEX idx_statuses_default_unique ON public.statuses USING btree (entity, is_default) WHERE (is_default = true)
;

CREATE INDEX idx_statuses_entity_id ON public.statuses USING btree (entity, id)
;

CREATE INDEX idx_system_settings_key ON public.system_settings USING btree (setting_key)
;

CREATE UNIQUE INDEX system_settings_setting_key_key ON public.system_settings USING btree (setting_key)
;

CREATE INDEX idx_unit_attachments_file ON public.unit_attachments USING btree (attachment_id)
;

CREATE INDEX idx_unit_attachments_unit_covering ON public.unit_attachments USING btree (unit_id) INCLUDE (attachment_id)
;

CREATE UNIQUE INDEX unit_sort_orders_project_id_building_floor_key ON public.unit_sort_orders USING btree (project_id, building, floor)
;

CREATE INDEX idx_units_building ON public.units USING btree (building) WHERE (building IS NOT NULL)
;

CREATE INDEX idx_units_floor ON public.units USING btree (floor) WHERE (floor IS NOT NULL)
;

CREATE INDEX idx_units_name ON public.units USING btree (name)
;

CREATE INDEX idx_units_project_building ON public.units USING btree (project_id, building)
;

CREATE INDEX idx_units_project_building_floor ON public.units USING btree (project_id, building, floor) WHERE ((building IS NOT NULL) AND (floor IS NOT NULL))
;

CREATE INDEX idx_units_project_floor ON public.units USING btree (project_id, floor) WHERE (floor IS NOT NULL)
;

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
;

CREATE INDEX messages_2025_10_08_inserted_at_topic_idx ON realtime.messages_2025_10_08 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
;

CREATE INDEX messages_2025_10_09_inserted_at_topic_idx ON realtime.messages_2025_10_09 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
;

CREATE INDEX messages_2025_10_10_inserted_at_topic_idx ON realtime.messages_2025_10_10 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
;

CREATE INDEX messages_2025_10_11_inserted_at_topic_idx ON realtime.messages_2025_10_11 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
;

CREATE INDEX messages_2025_10_12_inserted_at_topic_idx ON realtime.messages_2025_10_12 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
;

CREATE INDEX messages_2025_10_13_inserted_at_topic_idx ON realtime.messages_2025_10_13 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
;

CREATE INDEX messages_2025_10_14_inserted_at_topic_idx ON realtime.messages_2025_10_14 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE))
;

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity)
;

CREATE UNIQUE INDEX pk_subscription ON realtime.subscription USING btree (id)
;

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters)
;

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name)
;

CREATE UNIQUE INDEX migrations_name_key ON storage.migrations USING btree (name)
;

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name)
;

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level)
;

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C")
;

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level)
;

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops)
;

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C")
;

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops)
;

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at)
;

CREATE UNIQUE INDEX secrets_name_idx ON vault.secrets USING btree (name) WHERE (name IS NOT NULL)
;
