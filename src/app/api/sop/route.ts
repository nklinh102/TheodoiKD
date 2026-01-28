import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const agentCode = searchParams.get("agentCode");
        const uploadDate = searchParams.get("uploadDate");
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "50");

        let query = supabase
            .from("sop_data")
            .select("*", { count: "exact" });

        // Lọc theo agent_code nếu có
        if (agentCode) {
            query = query.ilike("agent_code", `%${agentCode}%`);
        }

        // Lọc theo upload_date nếu có
        if (uploadDate) {
            query = query.eq("upload_date", uploadDate);
        }

        // Sắp xếp theo ngày upload mới nhất
        query = query.order("upload_date", { ascending: false });
        query = query.order("agent_code", { ascending: true });

        // Phân trang
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error("Lỗi truy vấn SOP:", error);
            throw error;
        }

        return NextResponse.json({
            data: data || [],
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize)
        });

    } catch (error: any) {
        console.error("Lỗi lấy dữ liệu SOP:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
