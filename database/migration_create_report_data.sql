
CREATE TABLE IF NOT EXISTS public.report_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL, -- 'pending' or 'handover'
    content JSONB,
    report_date TEXT, -- Optional, mostly for handover
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookup by type
CREATE INDEX IF NOT EXISTS idx_report_data_type ON public.report_data(type);

-- Policy (Simple for now, can be restricted later)
ALTER TABLE public.report_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access for now" ON public.report_data
    FOR ALL
    USING (true)
    WITH CHECK (true);
