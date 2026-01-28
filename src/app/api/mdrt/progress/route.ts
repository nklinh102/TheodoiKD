import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        // MDRT 2027 targets (cumulative by month) - Đơn vị: nghìn đồng
        const mdrtTargets = [
            { month: "01/2026", target: 40000, monthName: "Tháng 1" },
            { month: "02/2026", target: 90000, monthName: "Tháng 2" },
            { month: "03/2026", target: 160000, monthName: "Tháng 3" },
            { month: "04/2026", target: 250000, monthName: "Tháng 4" },
            { month: "05/2026", target: 365000, monthName: "Tháng 5" },
            { month: "06/2026", target: 430000, monthName: "Tháng 6" },
            { month: "07/2026", target: 530000, monthName: "Tháng 7" },
            { month: "08/2026", target: 640000, monthName: "Tháng 8" },
            { month: "09/2026", target: 750000, monthName: "Tháng 9" },
            { month: "10/2026", target: 860000, monthName: "Tháng 10" },
            { month: "11/2026", target: 970000, monthName: "Tháng 11" },
            { month: "12/2026", target: 1073645.2, monthName: "Tháng 12" }
        ];

        return NextResponse.json({
            success: true,
            data: mdrtTargets
        });

    } catch (error: any) {
        console.error("Lỗi lấy tiến độ MDRT:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
