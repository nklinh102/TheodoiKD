
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const monthParam = searchParams.get("month"); // "YYYY-MM" or "all"

        let query = supabase
            .from("contracts")
            .select(`
                *,
                agents (
                    full_name,
                    rank,
                    manager_code,
                    manager_name
                )
            `);

        if (monthParam && monthParam !== 'all') {
            const [year, month] = monthParam.split("-"); // Expecting YYYY-MM from input type='month'
            if (year && month) {
                const startDate = `${year}-${month}-01`;
                // Calculate end date (last day of month)
                // Actually supabase ranges are inclusive for dates usually, but let's use filters
                // "submit_date" is usually YYYY-MM-DD

                // Construct next month for easier logic
                const nextMonth = month === '12' ? '01' : String(parseInt(month) + 1).padStart(2, '0');
                const nextYear = month === '12' ? String(parseInt(year) + 1) : year;
                const endDate = `${nextYear}-${nextMonth}-01`;

                query = query
                    .gte("submit_date", startDate)
                    .lt("submit_date", endDate);
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching contracts:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: "Không có dữ liệu hợp đồng nào cho giai đoạn này." }, { status: 404 });
        }

        // Format data for Excel
        const exportData = data.map((item: any, index: number) => ({
            "STT": index + 1,
            "Mã ĐL": item.agent_code,
            "Tên Đại lý": item.agents?.full_name || "",
            "Cấp bậc": item.agents?.rank || "",
            "MSQL": item.agents?.manager_code || "",
            "Tên Quản lý": item.agents?.manager_name || "",
            "Số HĐ": item.policy_number,
            "Tên Khách hàng": item.customer_name,
            "Sản phẩm": item.product_code,
            "Ngày nộp": item.submit_date ? new Date(item.submit_date).toLocaleDateString('vi-VN') : "",
            "Ngày cấp": item.issue_date ? new Date(item.issue_date).toLocaleDateString('vi-VN') : "",
            "Phí BH": item.fyp || 0,
            "APE": item.ape || 0,
            "Trạng thái": item.status === 'Issued' ? 'Đã cấp' :
                item.status === 'Cancelled' ? 'Hủy' :
                    item.status === 'Pending' ? 'Chờ cấp' :
                        item.status === 'Ack' ? 'ACK' : item.status
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Auto-width columns (simple estimation)
        const wscols = [
            { wch: 5 },  // STT
            { wch: 10 }, // Ma DL
            { wch: 25 }, // Ten DL
            { wch: 10 }, // Rank
            { wch: 10 }, // MSQL
            { wch: 25 }, // Ten QL
            { wch: 15 }, // So HD
            { wch: 25 }, // Ten KH
            { wch: 15 }, // San pham
            { wch: 12 }, // Ngay nop
            { wch: 12 }, // Ngay cap
            { wch: 15 }, // Phi BH
            { wch: 15 }, // APE
            { wch: 15 }, // Trang thai
        ];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Danh sách Hợp đồng");

        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buf, {
            status: 200,
            headers: {
                "Content-Disposition": `attachment; filename="Danh_sach_HD_${monthParam || 'all'}.xlsx"`,
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });

    } catch (e: any) {
        console.error("Export error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
