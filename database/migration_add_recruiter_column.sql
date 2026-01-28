-- Add recruiter_code column
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS recruiter_code TEXT;

-- Create index for recruiter lookups
CREATE INDEX IF NOT EXISTS idx_agents_recruiter_code ON agents(recruiter_code);
