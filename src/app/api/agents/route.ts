import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        const { data, error } = await supabase
            .from("agents")
            .select("*")
            .order("full_name", { ascending: true });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error("Fetch agents error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        // Basic validation could go here

        const { error } = await supabase
            .from("agents")
            .insert(body);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Create agent error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const all = searchParams.get('all');

        if (all === 'true') {
            const { error } = await supabase
                .from("agents")
                .delete()
                .neq('agent_code', 'PLACEHOLDER_TO_DELETE_ALL');
            // To delete all rows in Supabase without WHERE clause, we typically need a condition that is always true or use a specific filter.
            // .delete().neq('id', 0) often works if there is an id.
            // Safer: .delete().gt('created_at', '1970-01-01') or similar.

            // Actually, Supabase JS client requires a filter for delete unless disable in settings?
            // Let's try .gt('agent_code', '') assuming code is a string.

            const result = await supabase.from("agents").delete().neq('agent_code', '______');

            if (result.error) throw result.error;

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Missing 'all' parameter" }, { status: 400 });
    } catch (error: any) {
        console.error("Delete all agents error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
