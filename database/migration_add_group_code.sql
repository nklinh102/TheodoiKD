-- Add group_code column to agents table
ALTER TABLE agents
ADD COLUMN group_code TEXT;

-- Comment for clarity
COMMENT ON COLUMN agents.group_code IS 'Explicit Group Code (Mã tổ) managed by user or imported from data CA';
