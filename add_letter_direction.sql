ALTER TABLE letters ADD COLUMN direction text DEFAULT 'incoming' NOT NULL;
UPDATE letters SET direction='outgoing' WHERE receiver_person_id IS NOT NULL OR receiver_contractor_id IS NOT NULL;
