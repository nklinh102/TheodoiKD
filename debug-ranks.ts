
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// Hardcode credentials if env not loading or reuse existing logic
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// If env vars are missing in this context, we might fail. 
// But let's assume valid env file exists.
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Checking Ranks...");

    // 1. Count Ranks
    const { data: agents, error } = await supabase
        .from("agents")
        .select("rank, agent_code, group_code, full_name");

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    const counts: Record<string, number> = {};
    const managers: any[] = [];
    const highRanks = ['UM', 'SUM', 'DM', 'SDM', 'BM', 'AM'];

    agents.forEach((a: any) => {
        const r = (a.rank || "NULL").trim().toUpperCase();
        counts[r] = (counts[r] || 0) + 1;
        if (highRanks.includes(r)) {
            managers.push(a);
        }
    });

    console.log("Rank Counts:", counts);
    console.log("Managers found:", managers.length);
    if (managers.length > 0) {
        console.log("Sample Managers:", managers.slice(0, 5));
    } else {
        console.log("NO MANAGERS FOUND WITH RANKS:", highRanks);
        console.log("Sample Agents:", agents.slice(0, 5));
    }
}

run();
