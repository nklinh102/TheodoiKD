-- Remove the constraint entirely to allow any Rank value from your CSV
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_rank_check;
