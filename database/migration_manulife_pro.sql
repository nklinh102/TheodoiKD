-- Migration: Create manulife_pro_metadata table
-- This table stores manually entered data for Manulife Pro tracking

CREATE TABLE IF NOT EXISTS public.manulife_pro_metadata (
    agent_code TEXT PRIMARY KEY REFERENCES public.agents(agent_code) ON DELETE CASCADE,
    promo_month TEXT, -- e.g., "11/2025"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.manulife_pro_metadata ENABLE ROW LEVEL SECURITY;

-- Policy (Full access for now)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'manulife_pro_metadata' AND policyname = 'Allow all access'
    ) THEN
        CREATE POLICY "Allow all access" ON public.manulife_pro_metadata
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
