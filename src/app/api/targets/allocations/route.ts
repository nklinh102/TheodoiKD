import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { month, allocations } = body; // allocations: [{ manager_code, fyp_target, active_target }]

        if (!month || !Array.isArray(allocations)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        if (allocations.length === 0) {
            return NextResponse.json({ success: true, message: "No allocations to update" });
        }

        // Prepare format for upsert
        const upsertData = allocations.map((alloc: any) => ({
            month,
            manager_code: alloc.manager_code,
            fyp_target: alloc.fyp_target || 0,
            active_target: alloc.active_target || 0,
            updated_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from("team_allocations")
            .upsert(upsertData, { onConflict: 'month, manager_code' })
            .select();

        if (error) throw error;

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
