# DB Index Summary

## claim_attachments
- `claim_attachments_pkey` - `UNIQUE (claim_id, attachment_id)`
- `idx_claim_attachments_claim` - `(claim_id)`

## claim_units
- `claim_units_pkey` - `UNIQUE (claim_id, unit_id)`
- `idx_claim_units_unit` - `(unit_id)`

## claims
- `claims_pkey` - `UNIQUE (id)`
- `idx_claims_project` - `(project_id)`

## court_cases
- `court_cases_pkey` - `UNIQUE (id)`
- `idx_court_cases_project` - `(project_id)`
- `idx_court_cases_status` - `(status)`
- `idx_court_cases_lawyer` - `(responsible_lawyer_id)`
