
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'pending' or 'handover'

    if (!type) {
        return NextResponse.json({ error: "Missing type parameter" }, { status: 400 });
    }

    try {
        // Fetch the latest entry for this type
        // We only need the latest one because we overwrite or append? 
        // User wants "Save" behavior. Usually overwriting the "current state".
        // Let's get the most recent one.
        const { data, error } = await supabase
            .from("report_data")
            .select("*")
            .eq("type", type)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is no rows
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: data || null });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, content, report_date } = body;

        if (!type || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // We can either update a single row or insert new history.
        // Let's insert new history for safety, but maybe limit cleanup later?
        // Or just Upsert a single row if we don't care about history.
        // Let's Upsert based on type if we want only 1 active copy per type? 
        // No, maybe multiple users? But this is a simple app.
        // Let's just Insert a new row to keep history (optional) or delete old ones?
        // Simpler: Delete all old for this type, insert new. 
        // Or just Upsert if we had a unique key. 
        // Let's use INSERT for now, getting latest in GET.

        const { data, error } = await supabase
            .from("report_data")
            .insert({
                type,
                content,
                report_date // Optional
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
