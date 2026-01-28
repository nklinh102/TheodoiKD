
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        const { data, error } = await supabase
            .from("agents")
            .select("rank, full_name, agent_code, group_code");

        if (error) throw error;

        const rankCounts: Record<string, number> = {};
        const sampleManagers: any[] = [];

        data.forEach((agent: any) => {
            const r = (agent.rank || "NULL").toUpperCase();
            rankCounts[r] = (rankCounts[r] || 0) + 1;

            if (['UM', 'SUM', 'DM', 'SDM', 'BM', 'AM'].includes(r)) {
                if (sampleManagers.length < 5) sampleManagers.push(agent);
            }
        });

        return NextResponse.json({
            rankCounts,
            sampleManagers
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
