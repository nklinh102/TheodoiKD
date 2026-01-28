-- Add manager_name column to store the text value from CSV
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS manager_name TEXT;
