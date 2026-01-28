-- Create global_targets table
CREATE TABLE IF NOT EXISTS global_targets (
    month TEXT PRIMARY KEY, -- Format: 'YYYY-MM'
    fyp_target NUMERIC DEFAULT 0,
    active_target INTEGER DEFAULT 0,
    actual_fyp NUMERIC DEFAULT 0, -- Manual overwrite or calculated snapshot
    actual_active INTEGER DEFAULT 0, -- Manual overwrite or calculated snapshot
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create team_allocations table
CREATE TABLE IF NOT EXISTS team_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month TEXT NOT NULL REFERENCES global_targets(month) ON DELETE CASCADE,
    manager_code TEXT NOT NULL, -- Links to agents.agent_code (manager)
    fyp_target NUMERIC DEFAULT 0,
    active_target INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(month, manager_code)
);

-- Enable RLS (Optional, usually good practice)
ALTER TABLE global_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_allocations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read/write for authenticated users (adjust as needed)
CREATE POLICY "Allow public read global_targets" ON global_targets FOR SELECT USING (true);
CREATE POLICY "Allow public insert global_targets" ON global_targets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update global_targets" ON global_targets FOR UPDATE USING (true);

CREATE POLICY "Allow public read team_allocations" ON team_allocations FOR SELECT USING (true);
CREATE POLICY "Allow public insert team_allocations" ON team_allocations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update team_allocations" ON team_allocations FOR UPDATE USING (true);
