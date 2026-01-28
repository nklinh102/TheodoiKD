import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        // 1. Get latest SOP date
        const { data: latestDateObj, error: dateError } = await supabase
            .from("sop_data")
            .select("upload_date")
            .order("upload_date", { ascending: false })
            .limit(1)
            .single();

        if (dateError && dateError.code !== 'PGRST116') throw dateError;
        const uploadDate = latestDateObj?.upload_date;

        if (!uploadDate) {
            return NextResponse.json({ success: true, data: [], meta: { message: "Chưa có dữ liệu SOP" } });
        }

        // 2. Fetch SOP data for Pro agents
        const { data: sopRecords, error: sopError } = await supabase
            .from("sop_data")
            .select("*")
            .eq("upload_date", uploadDate);

        if (sopError) throw sopError;

        // 2. Fetch supplemental FYP from contracts table (issued after latest SOP date)
        const { data: supplementalContracts, error: contractError } = await supabase
            .from("contracts")
            .select("agent_code, fyp, issue_date")
            .eq("status", "Issued")
            .gt("issue_date", uploadDate);

        if (contractError) throw contractError;

        // Find the latest issue date among ALL issued contracts to determine the display date
        const { data: latestContractObj, error: latestContractError } = await supabase
            .from("contracts")
            .select("issue_date")
            .eq("status", "Issued")
            .order("issue_date", { ascending: false })
            .limit(1)
            .single();

        if (latestContractError && latestContractError.code !== 'PGRST116') throw latestContractError;

        const latestContractIssueDate = latestContractObj?.issue_date;

        // Display update date is the max of SOP date and latest contract issue date
        let displayUpdateDate = uploadDate;
        if (latestContractIssueDate && latestContractIssueDate > uploadDate) {
            displayUpdateDate = latestContractIssueDate;
        }

        const supplementalFypMap: Record<string, number> = {};
        supplementalContracts?.forEach(c => {
            if (c.agent_code) {
                supplementalFypMap[c.agent_code] = (supplementalFypMap[c.agent_code] || 0) + (c.fyp || 0);
            }
        });

        // 4. Fetch manual metadata (Promo Month)
        const { data: metaRecords } = await supabase
            .from("manulife_pro_metadata")
            .select("*");

        const metaMap: Record<string, string> = {};
        metaRecords?.forEach(m => {
            metaMap[m.agent_code] = m.promo_month;
        });

        // 5. Reward Calculation Logic
        const calculateBonus = (type: string, fyp: number) => {
            const isBKM = type.includes("Bạch Kim");
            const isVang = type.includes("Vàng");
            const isBac = type.includes("Bạc");

            if (isBKM) {
                if (fyp >= 120000) return { bonus: 20000, next: null };
                if (fyp >= 100000) return { bonus: 16000, next: 120000 };
                if (fyp >= 80000) return { bonus: 12000, next: 100000 };
                if (fyp >= 60000) return { bonus: 10000, next: 80000 };
                if (fyp >= 45000) return { bonus: 8000, next: 60000 };
                if (fyp >= 30000) return { bonus: 4000, next: 45000 };
                if (fyp >= 15000) return { bonus: 2000, next: 30000 };
                return { bonus: 0, next: 15000 };
            }
            if (isVang) {
                if (fyp >= 60000) return { bonus: 7000, next: null };
                if (fyp >= 45000) return { bonus: 5000, next: 60000 };
                if (fyp >= 30000) return { bonus: 3000, next: 45000 };
                if (fyp >= 15000) return { bonus: 1500, next: 30000 };
                return { bonus: 0, next: 15000 };
            }
            if (isBac) {
                if (fyp >= 45000) return { bonus: 3000, next: null }; // Max for Bạc is at 45k? Image shows only up to 45k for Bạc
                if (fyp >= 30000) return { bonus: 3000, next: 45000 };
                if (fyp >= 15000) return { bonus: 1500, next: 30000 };
                return { bonus: 0, next: 15000 };
            }
            return { bonus: 0, next: null };
        };

        // 6. Map and process records
        const proAgents = sopRecords
            .filter((r: any) => {
                const group = r.data["Nhóm Đại lý"] || r.data["Nhóm ĐL"] || "";
                return group.includes("Manulife Pro");
            })
            .map((r: any) => {
                const d = r.data;
                const agentCode = r.agent_code;
                const proType = d["Nhóm Đại lý"] || d["Nhóm ĐL"];
                const fullName = d["Tên Đại lý"] || d["Tên đầy đủ Đại lý"] || agentCode;
                const sopFyp = parseFloat(String(d["FYP  tháng T"] || "0").replace(/,/g, ''));
                const supplementalFyp = supplementalFypMap[agentCode] || 0;
                const totalFyp = sopFyp + supplementalFyp;

                const reward = calculateBonus(proType, totalFyp);

                return {
                    stt: 0, // Will set after sorting
                    agent_code: agentCode,
                    full_name: fullName,
                    pro_type: proType,
                    promo_month: metaMap[agentCode] || "",
                    monthly_fyp: totalFyp,
                    sop_fyp: sopFyp,
                    supplemental_fyp: supplementalFyp,
                    bonus_amount: reward.bonus,
                    next_tier: reward.next,
                    remaining_fyp: reward.next ? Math.max(0, reward.next - totalFyp) : 0
                };
            });

        // Rank Order Definition
        const rankOrder: Record<string, number> = {
            "Manulife Pro Bạch Kim": 1,
            "Manulife Pro Vàng": 2,
            "Manulife Pro Bạc": 3
        };

        // Sort by Rank (asc) then by FYP (desc) and add STT
        proAgents.sort((a, b) => {
            const orderA = rankOrder[a.pro_type] || 99;
            const orderB = rankOrder[b.pro_type] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return b.monthly_fyp - a.monthly_fyp;
        });
        proAgents.forEach((a, i) => a.stt = i + 1);

        return NextResponse.json({
            success: true,
            data: proAgents,
            meta: {
                uploadDate: displayUpdateDate,
                sopDate: uploadDate,
                contractDate: latestContractIssueDate,
                sopMonth: uploadDate.slice(0, 7)
            }
        });

    } catch (error: any) {
        console.error("Manulife Pro Bonus API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { agent_code, promo_month } = body;

        if (!agent_code) {
            return NextResponse.json({ error: "Missing agent_code" }, { status: 400 });
        }

        const { error } = await supabase
            .from("manulife_pro_metadata")
            .upsert({ agent_code, promo_month }, { onConflict: "agent_code" });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Save Pro Metadata Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
