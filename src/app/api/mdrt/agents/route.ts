import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month") || (new Date().getMonth() + 1).toString().padStart(2, '0');
        const limit = searchParams.get("limit");

        // MDRT targets for 2026 (cumulative) - Đơn vị: nghìn đồng
        const mdrtTargets: Record<string, number> = {
            "01": 40000,
            "02": 90000,
            "03": 160000,
            "04": 250000,
            "05": 365000,
            "06": 430000,
            "07": 530000,
            "08": 640000,
            "09": 750000,
            "10": 860000,
            "11": 970000,
            "12": 1073645.2
        };

        const currentMonthTarget = mdrtTargets[month] || 0;

        // 1. Get the latest upload_date from sop_data
        const { data: latestDateObj, error: dateError } = await supabase
            .from("sop_data")
            .select("upload_date")
            .order("upload_date", { ascending: false })
            .limit(1)
            .single();

        if (dateError && dateError.code !== 'PGRST116') throw dateError;

        const latestSopDate = latestDateObj?.upload_date;
        if (!latestSopDate) {
            return NextResponse.json({ success: true, data: [], meta: { message: "Chưa có dữ liệu SOP" } });
        }

        // 2. Fetch supplemental FYP from contracts table (issued after latest SOP date)
        const { data: supplementalContracts, error: contractError } = await supabase
            .from("contracts")
            .select("agent_code, fyp, issue_date")
            .eq("status", "Issued")
            .gt("issue_date", latestSopDate);

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
        let displayUpdateDate = latestSopDate;
        if (latestContractIssueDate && latestContractIssueDate > latestSopDate) {
            displayUpdateDate = latestContractIssueDate;
        }

        // Group supplemental FYP by agent_code
        const supplementalFypMap: Record<string, number> = {};
        supplementalContracts?.forEach(c => {
            if (c.agent_code) {
                supplementalFypMap[c.agent_code] = (supplementalFypMap[c.agent_code] || 0) + (c.fyp || 0);
            }
        });

        // 3. Fetch all SOP data for the latest date
        const { data: sopRecords, error: sopError } = await supabase
            .from("sop_data")
            .select("*")
            .eq("upload_date", latestSopDate);

        if (sopError) throw sopError;

        // 3.5. Fetch active agents to filter the results
        const { data: activeAgents, error: agentsError } = await supabase
            .from("agents")
            .select("agent_code, status")
            .eq("status", "Active");

        if (agentsError) throw agentsError;

        const activeAgentCodes = new Set(activeAgents?.map(a => a.agent_code) || []);

        // 4. Map SOP data to MDRT agent structure and add supplemental FYP
        // Filter to only include Active agents
        const agentData = sopRecords
            .filter((record: any) => activeAgentCodes.has(record.agent_code))
            .map((record: any) => {
                const d = record.data || {};

                // Helper to get value with multiple potential keys
                const getVal = (...keys: string[]) => {
                    for (const k of keys) {
                        if (d[k] !== undefined && d[k] !== null && d[k] !== "") return d[k];
                    }
                    return null;
                };

                // Parse FYP Issued from SOP column ' MDRT-FYP tới hiện tại '
                const rawFyp = getVal(' MDRT-FYP tới hiện tại ', 'MDRT-FYP tới hiện tại', 'FYP Issued');
                const sopFyp = typeof rawFyp === 'number' ? rawFyp : parseFloat(String(rawFyp || "0").replace(/,/g, ''));

                // Add supplemental FYP
                const supplementalFyp = supplementalFypMap[record.agent_code] || 0;
                const totalFypIssued = sopFyp + supplementalFyp;

                const fullName = getVal('Tên Đại lý', 'Tên đầy đủ Đại lý', 'Full Name') || record.agent_code;
                const rank = getVal('Chức danh', 'Rank', 'Cấp bậc') || "N/A";

                const progress = currentMonthTarget > 0 ? (totalFypIssued / currentMonthTarget) * 100 : 0;
                const remaining = Math.max(0, currentMonthTarget - totalFypIssued);

                return {
                    agent_code: record.agent_code,
                    full_name: fullName,
                    rank: rank,
                    fyp_issued: totalFypIssued,
                    sop_fyp: sopFyp, // Keep for reference if needed
                    supplemental_fyp: supplementalFyp, // Keep for reference if needed
                    progress_percent: Math.round(progress * 100) / 100,
                    remaining_fyp: remaining
                };
            });

        // 5. Add agents who have supplemental FYP but are NOT in SOP (new agents)
        const sopAgentCodes = new Set(sopRecords.map(r => r.agent_code));
        Object.entries(supplementalFypMap).forEach(([agentCode, supplementalFyp]) => {
            if (!sopAgentCodes.has(agentCode)) {
                // Future: add details for new agents if necessary
            }
        });

        // Sort by FYP issued (descending)
        agentData.sort((a, b) => b.fyp_issued - a.fyp_issued);

        // Apply limit if specified
        let result = agentData;
        if (limit) {
            const limitNum = parseInt(limit);
            result = agentData.slice(0, limitNum);
        }

        return NextResponse.json({
            success: true,
            data: result,
            meta: {
                month,
                currentMonthTarget,
                uploadDate: displayUpdateDate,
                sopDate: latestSopDate,
                contractDate: latestContractIssueDate,
                totalAgents: agentData.length,
                displayedAgents: result.length,
                hasSupplementalData: supplementalContracts && supplementalContracts.length > 0
            }
        });

    } catch (error: any) {
        console.error("Lỗi lấy dữ liệu MDRT từ SOP:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
