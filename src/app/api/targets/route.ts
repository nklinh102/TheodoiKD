import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month");
        const year = searchParams.get("year");

        // CASE 1: Fetch Yearly Overview
        if (year) {
            const { data: yearTargets, error } = await supabase
                .from("global_targets")
                .select("*")
                .like("month", `${year}-%`)
                .order("month", { ascending: true });

            if (error) throw error;

            // Normalize to ensure all 12 months exist in response
            const months = Array.from({ length: 12 }, (_, i) => {
                const m = i + 1;
                const monthStr = `${year}-${m < 10 ? '0' + m : m}`;
                const existing = yearTargets?.find(t => t.month === monthStr);
                return existing || { month: monthStr, fyp_target: 0, active_target: 0, actual_fyp: 0, actual_active: 0 };
            });

            return NextResponse.json({ success: true, data: months });
        }

        // CASE 2: Fetch Monthly Detail
        if (!month) {
            return NextResponse.json({ error: "Month or Year is required" }, { status: 400 });
        }

        // 1. Get Global Target
        const { data: globalTarget, error: globalError } = await supabase
            .from("global_targets")
            .select("*")
            .eq("month", month)
            .single();

        if (globalError && globalError.code !== 'PGRST116') { // PGRST116 is "not found"
            throw globalError;
        }

        // 2. Get Allocations
        const { data: allocations, error: allocError } = await supabase
            .from("team_allocations")
            .select("*")
            .eq("month", month);

        if (allocError) throw allocError;

        return NextResponse.json({
            success: true,
            data: {
                global: globalTarget || { month, fyp_target: 0, active_target: 0, actual_fyp: 0, actual_active: 0 },
                allocations: allocations || []
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { month, fyp_target, active_target, actual_fyp, actual_active } = body;

        if (!month) {
            return NextResponse.json({ error: "Month is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("global_targets")
            .upsert({
                month,
                fyp_target,
                active_target,
                actual_fyp,
                actual_active,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
