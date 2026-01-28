import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

        // 1. Get Summary Stats using the SQL function
        const { data: summaryData, error: summaryError } = await supabase.rpc(
            "get_dashboard_summary",
            { report_month: month }
        );

        if (summaryError) throw summaryError;

        // 2. Get Agent List with performance
        // Note: In a real app, we'd probably join with a team-specific filter 
        // but for the global dashboard, we'll fetch all active agents and their stats
        const { data: agentsData, error: agentsError } = await supabase
            .from("agents")
            .select(`
        agent_code,
        full_name,
        rank,
        status,
        contracts (
          fyp,
          status,
          submit_date
        )
      `)
            .eq("status", "Active");

        if (agentsError) throw agentsError;

        // Process agents data to calculate monthly FYP
        const processedAgents = agentsData.map((agent: any) => {
            const monthlyContracts = agent.contracts?.filter((c: any) =>
                c.submit_date.startsWith(month) && ["Issued", "Ack"].includes(c.status)
            ) || [];

            const personalFyp = monthlyContracts.reduce((sum: number, c: any) => sum + (c.fyp || 0), 0);

            return {
                agent_code: agent.agent_code,
                full_name: agent.full_name,
                rank: agent.rank,
                personal_fyp: personalFyp,
                status: agent.status,
                cc_count: monthlyContracts.length
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                summary: summaryData[0],
                agents: processedAgents
            }
        });
    } catch (error: any) {
        console.error("Dashboard data error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
