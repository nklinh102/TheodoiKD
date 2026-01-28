-- Migration to update Agents Status Check Constraint
-- This allows 'Pending' status (rank SA) in addition to Active and Terminated

ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_status_check;

ALTER TABLE agents 
    ADD CONSTRAINT agents_status_check 
    CHECK (status IN ('Active', 'Terminated', 'Pending'));
