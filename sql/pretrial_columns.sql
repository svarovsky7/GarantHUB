-- Добавление признака досудебной претензии
ALTER TABLE claims ADD COLUMN pre_trial_claim boolean NOT NULL DEFAULT false;
ALTER TABLE claim_defects ADD COLUMN pre_trial_claim boolean NOT NULL DEFAULT false;
