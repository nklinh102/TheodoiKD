import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const uploadDate = searchParams.get("uploadDate");

        let query = supabase
            .from("sop_data")
            .select("*");

        // Lọc theo upload_date nếu có
        if (uploadDate) {
            query = query.eq("upload_date", uploadDate);
        }

        // Sắp xếp theo agent_code
        query = query.order("agent_code", { ascending: true });

        const { data, error } = await query;

        if (error) {
            console.error("Lỗi truy vấn SOP:", error);
            throw error;
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: "Không có dữ liệu để xuất" }, { status: 404 });
        }

        // Chuyển đổi dữ liệu JSONB thành mảng cho Excel
        const excelData = data.map(record => record.data);

        // Tạo workbook và worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Thêm worksheet vào workbook
        XLSX.utils.book_append_sheet(wb, ws, "SOP Data");

        // Tạo buffer từ workbook
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Tạo tên file với ngày
        const fileName = uploadDate
            ? `SOP_Data_${uploadDate.replace(/-/g, '')}.xlsx`
            : `SOP_Data_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.xlsx`;

        // Trả về file Excel
        return new NextResponse(excelBuffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });

    } catch (error: any) {
        console.error("Lỗi xuất SOP:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
