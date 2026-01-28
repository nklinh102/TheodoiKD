-- Upgrade Rank Check Constraint
-- First, drop the existing constraint if it exists. 
-- Note: The name of the constraint might vary. Supabase usually names it "agents_rank_check".

ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_rank_check;

-- Re-add the constraint with the new values
ALTER TABLE agents
ADD CONSTRAINT agents_rank_check 
CHECK (rank IN ('FA', 'UM', 'SUM', 'DM', 'SDM', 'BM', 'AM', 'SA'));

-- Alternatively, if you are using an ENUM type in Postgres (less likely if using check constraint):
-- ALTER TYPE "Rank" ADD VALUE IF NOT EXISTS 'BM';
-- ALTER TYPE "Rank" ADD VALUE IF NOT EXISTS 'AM';
-- ALTER TYPE "Rank" ADD VALUE IF NOT EXISTS 'SA';
