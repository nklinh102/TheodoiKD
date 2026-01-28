import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ code: string }> } // Use Promise for params
) {
    try {
        const params = await context.params; // Await the params
        const body = await req.json();
        const { code } = params;

        const { error } = await supabase
            .from("agents")
            .update(body)
            .eq("agent_code", code);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Update agent error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ code: string }> } // Use Promise for params
) {
    try {
        const params = await context.params; // Await the params
        const { code } = params;

        const { error } = await supabase
            .from("agents")
            .delete()
            .eq("agent_code", code);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete agent error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
