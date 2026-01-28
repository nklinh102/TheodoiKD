-- Remove the Foreign Key constraint for manager_code
-- This allows imports to succeed even if the manager hasn't been imported yet (or doesn't exist).

ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_manager_code_fkey;

-- Also drop for recruiter_code if it exists, just in case
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_recruiter_code_fkey;
