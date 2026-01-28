import { NextResponse } from "next/server";

export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    return NextResponse.json({
        status: "ok",
        env_check: {
            NEXT_PUBLIC_SUPABASE_URL: url ? `${url.substring(0, 15)}...` : "MISSING",
            NEXT_PUBLIC_SUPABASE_ANON_KEY: key ? "PRESENT" : "MISSING",
            NODE_ENV: process.env.NODE_ENV
        }
    });
}
