ALTER TABLE court_cases
ADD COLUMN created_by uuid REFERENCES profiles(id);
