import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const uploadDate = searchParams.get("uploadDate");

        let query = supabase
            .from("sop_data")
            .select("data");

        // Lọc theo upload_date nếu có, nếu không lấy ngày mới nhất
        if (uploadDate) {
            query = query.eq("upload_date", uploadDate);
        } else {
            // Lấy dữ liệu của ngày mới nhất
            const { data: latestDate } = await supabase
                .from("sop_data")
                .select("upload_date")
                .order("upload_date", { ascending: false })
                .limit(1)
                .single();

            if (latestDate) {
                query = query.eq("upload_date", latestDate.upload_date);
            }
        }

        const { data, error } = await query;

        if (error) {
            console.error("Lỗi truy vấn SOP:", error);
            throw error;
        }

        if (!data || data.length === 0) {
            return NextResponse.json({
                success: true,
                groups: [],
                saCount: 0
            });
        }

        // Đếm số lượng theo nhóm đại lý
        const groupCounts: Record<string, number> = {};
        let saCount = 0;

        data.forEach((record: any) => {
            const rowData = record.data;

            // Tìm cột "Chức danh" để check SA
            const rank = rowData["Chức danh"]
                || rowData["Cấp bậc"]
                || rowData["Rank"]
                || "";

            // Tìm cột "Nhóm đại lý"
            const groupName = rowData["Nhóm Đại lý"]
                || rowData["Nhóm ĐL"]
                || rowData["Group"]
                || "";

            // Nếu là SA, chỉ đếm riêng (không thêm vào biểu đồ)
            if (rank.toString().trim().toUpperCase() === "SA") {
                saCount++;
            } else {
                // Đếm các nhóm khác (không phải SA)
                // Chỉ đếm nếu có tên nhóm
                if (groupName && groupName.toString().trim() !== "") {
                    const group = groupName.toString().trim();
                    groupCounts[group] = (groupCounts[group] || 0) + 1;
                }
            }
        });

        // Định nghĩa thứ tự sắp xếp
        const groupOrder: Record<string, number> = {
            "Manulife Pro Bạch Kim": 1,
            "Manulife Pro Vàng": 2,
            "Manulife Pro Bạc": 3,
            "M0": 4,
            "M1-3": 5,
            "M4-6": 6,
            "M7-12": 7,
            "M13+": 8
        };

        // Chuyển đổi thành mảng và sắp xếp theo thứ tự tùy chỉnh
        const groups = Object.entries(groupCounts)
            .map(([name, count]) => ({
                name,
                count,
                order: groupOrder[name] || 999 // Nhóm không có trong danh sách sẽ ở cuối
            }))
            .sort((a, b) => a.order - b.order)
            .map(({ name, count }) => ({ name, count })); // Loại bỏ field order

        return NextResponse.json({
            success: true,
            groups,
            saCount
        });

    } catch (error: any) {
        console.error("Lỗi lấy thống kê nhóm:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
