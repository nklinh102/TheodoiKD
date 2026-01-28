-- Migration to update Agents Rank and Status Check Constraints
-- Adds 'Ter' and 'SM' to Rank
-- Adds 'Hold' to Status

-- 1. Update Rank Constraint
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_rank_check;

ALTER TABLE agents
    ADD CONSTRAINT agents_rank_check
    CHECK (rank IN ('FA', 'UM', 'SUM', 'DM', 'SDM', 'BM', 'AM', 'SA', 'SM', 'Ter'));

-- 2. Update Status Constraint
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_status_check;

ALTER TABLE agents 
    ADD CONSTRAINT agents_status_check 
    CHECK (status IN ('Active', 'Terminated', 'Pending', 'Hold'));
