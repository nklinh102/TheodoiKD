import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_')) {
    console.error("❌ Thiếu/Sai thông tin kết nối Supabase trong file .env.local!");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
