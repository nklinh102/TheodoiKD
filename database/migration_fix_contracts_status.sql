
-- Remove the strict CHECK constraint on contracts status if it exists
-- This allows any status string, useful for import flexibility

ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;

-- Optional: Add it back with broader values if needed, or leave it flexible
-- ALTER TABLE contracts ADD CONSTRAINT contracts_status_check CHECK (status IN ('Pending', 'Issued', 'Ack', 'Cancelled', 'Terminated', 'Active'));
