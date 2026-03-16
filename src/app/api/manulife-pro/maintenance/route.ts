import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        // 1. Get latest SOP date to identify current Pro agents
        const { data: latestDateObj } = await supabase
            .from("sop_data")
            .select("upload_date")
            .order("upload_date", { ascending: false })
            .limit(1)
            .single();

        const uploadDate = latestDateObj?.upload_date;
        if (!uploadDate) {
            return NextResponse.json({ success: true, data: [], meta: { message: "Chưa có dữ liệu SOP" } });
        }

        // 2. Fetch SOP data for Pro agents
        const { data: sopRecords } = await supabase
            .from("sop_data")
            .select("*")
            .eq("upload_date", uploadDate);

        // 3. Fetch manual metadata (Promo Month)
        const { data: metaRecords } = await supabase
            .from("manulife_pro_metadata")
            .select("*");

        const metaMap: Record<string, string> = {};
        metaRecords?.forEach(m => {
            metaMap[m.agent_code] = m.promo_month;
        });

        // 4. Fetch maintenance stats (FYP and Active Months history)
        const { data: statsRecords } = await supabase
            .from("manulife_pro_maintenance_stats")
            .select("*");

        const statsMap: Record<string, { fyp: number, active_months: number }[]> = {};
        statsRecords?.forEach(s => {
            if (!statsMap[s.agent_code]) statsMap[s.agent_code] = [];
            statsMap[s.agent_code].push({ fyp: s.fyp || 0, active_months: s.active_months || 0, month: s.month } as any);
        });

        // 5. Filter and map agents
        const agents = sopRecords
            ?.filter((r: any) => {
                const d = r.data || {};
                const group = String(d["Nhóm Đại lý"] || d["Nhóm ĐL"] || "").toLowerCase();
                const mbaTitle = String(d["Danh hiệu MBA Pro"] || "").toLowerCase();
                return group.includes("manulife pro") || mbaTitle.includes("pro");
            })
            .map((r: any) => {
                const d = r.data;
                const agentCode = r.agent_code;
                const proType = d["Nhóm Đại lý"] || d["Nhóm ĐL"];
                const fullName = d["Tên Đại lý"] || d["Tên đầy đủ Đại lý"] || agentCode;
                const workingMonths = parseInt(String(d["Số tháng làm việc"] || d["Số tháng LV"] || "0"));
                const promoMonthStr = metaMap[agentCode] || ""; // Format "MM/YYYY" or "YYYY/MM"

                // Persistence Rate from SOP
                let persistenceRate = d["TLDTHD cá nhân"] || d["TLDTHD cấp 1"] || 0;
                if (typeof persistenceRate === 'string') {
                    persistenceRate = parseFloat(persistenceRate.replace('%', ''));
                } else if (persistenceRate < 1) {
                    persistenceRate *= 100;
                }

                // Calculate cumulative stats for 12 months from promo month
                let currentFyp = 0;
                let activeMonths = 0;
                let periodStr = "---";

                if (promoMonthStr && promoMonthStr.includes('/')) {
                    const parts = promoMonthStr.split('/');
                    let startYear, startMonth;
                    if (parts[0].length === 4) { [startYear, startMonth] = parts.map(Number); }
                    else { [startMonth, startYear] = parts.map(Number); }

                    const startDate = new Date(startYear, startMonth - 1, 1);
                    const endDate = new Date(startYear, startMonth - 1 + 11, 1);
                    periodStr = `${(startDate.getMonth() + 1).toString().padStart(2, '0')}/${startDate.getFullYear()} - ${(endDate.getMonth() + 1).toString().padStart(2, '0')}/${endDate.getFullYear()}`;

                    const agentStats = statsMap[agentCode] || [];
                    agentStats.forEach((s: any) => {
                        const sYear = parseInt(s.month.substring(0, 4));
                        const sMonth = parseInt(s.month.substring(4, 6));
                        const sDate = new Date(sYear, sMonth - 1, 1);

                        if (sDate >= startDate && sDate <= endDate) {
                            currentFyp += s.fyp;
                            activeMonths += s.active_months;
                        }
                    });
                }

                // Calculate months left to MOC
                let monthsToMoc = -1;
                if (promoMonthStr && promoMonthStr.includes('/')) {
                    const parts = promoMonthStr.split('/');
                    let startYear, startMonth;
                    if (parts[0].length === 4) { [startYear, startMonth] = parts.map(Number); }
                    else { [startMonth, startYear] = parts.map(Number); }

                    const endDate = new Date(startYear, startMonth - 1 + 11, 1);
                    const now = new Date();
                    monthsToMoc = (endDate.getFullYear() - now.getFullYear()) * 12 + (endDate.getMonth() - now.getMonth());
                }

                return {
                    agent_code: agentCode,
                    full_name: fullName,
                    pro_type: proType,
                    working_months: workingMonths,
                    promo_month: promoMonthStr,
                    period: periodStr,
                    current_fyp: Math.round(currentFyp),
                    active_months: activeMonths,
                    persistence_rate: Math.round(persistenceRate * 10) / 10,
                    months_to_moc: monthsToMoc,
                    note: "" // Placeholder for "Ghi chú Moc"
                };
            });

        // Sort by Rank then Name
        const rankOrder: Record<string, number> = {
            "Manulife Pro Bạch Kim": 1,
            "Manulife Pro Vàng": 2,
            "Manulife Pro Bạc": 3
        };

        agents?.sort((a, b) => {
            const orderA = rankOrder[a.pro_type] || 99;
            const orderB = rankOrder[b.pro_type] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return a.full_name.localeCompare(b.full_name);
        });

        // Add STT
        agents?.forEach((a, i) => (a as any).stt = i + 1);

        return NextResponse.json({
            success: true,
            data: agents,
            meta: { uploadDate }
        });

    } catch (error: any) {
        console.error("Maintenance API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
