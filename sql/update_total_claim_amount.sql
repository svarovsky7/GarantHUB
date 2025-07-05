ALTER TABLE court_cases ADD COLUMN IF NOT EXISTS total_claim_amount numeric;

UPDATE court_cases cc
SET total_claim_amount = sub.sum_claim
FROM (
  SELECT case_id, SUM(claimed_amount) AS sum_claim
  FROM court_case_claims
  GROUP BY case_id
) AS sub
WHERE cc.id = sub.case_id;

