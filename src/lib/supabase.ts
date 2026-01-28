import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zjjgctclgkkjcqvuxfaw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_TyUGpjacx60LvwLb89gTTg_4QmwJFqZ';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("⚠️ Using hardcoded Supabase connection details (Env vars missing)");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
