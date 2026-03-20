-- Set the properly filled Picture Hanging listing to live
UPDATE service_listings SET status = 'live', published_at = now() WHERE id = '32a6c104-61b9-4e36-821a-3b24e2d58ac0';

-- Revert incomplete listings that are currently live but have no pricing items
UPDATE service_listings SET status = 'draft', published_at = NULL WHERE id IN ('bc440db6-7011-4e55-88e8-415d24110a1d', 'd382b6df-61df-4a03-a5bc-ae8650707a60');