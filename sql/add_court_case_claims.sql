CREATE TABLE court_case_claims (
    id BIGSERIAL PRIMARY KEY,
    case_id BIGINT NOT NULL REFERENCES court_cases(id) ON DELETE CASCADE,
    claim_type_id BIGINT NOT NULL REFERENCES lawsuit_claim_types(id),
    claimed_amount NUMERIC,
    confirmed_amount NUMERIC,
    paid_amount NUMERIC,
    agreed_amount NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
