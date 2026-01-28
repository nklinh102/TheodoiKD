
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // YYYY-MM
        const filter = searchParams.get("filter"); // all, issued, submitted, pending

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

        // Apply Month Filter
        if (month) {
            // Calculate correct start and end dates for the selected month
            const [y, m] = month.split('-').map(Number);
            const lastDay = new Date(y, m, 0).getDate();
            const startDate = `${month}-01`;
            const endDate = `${month}-${lastDay}`;

            // "Nộp trong tháng" vs "Cấp trong tháng" vs "Pending"
            // If filter is 'issued', we verify issue_date in month
            // If filter is 'submitted' or default, we check submit_date in month
            // If filter is 'pending', we check status='Pending' (and maybe submit_date?)

            if (filter === 'issued') {
                query = query.gte('issue_date', startDate)
                    .lte('issue_date', endDate)
                    .neq('status', 'Cancelled')
                    .order('submit_date', { ascending: true });
            } else if (filter === 'cancelled') {
                const startDate = `${month}-01`;
                // For cancelled, usually we check if status is cancelled. 
                // If we want "Cancelled IN Month", we need a cancelled_date. 
                // Import logic maps "Từ chối" date -> status=Cancelled.
                // Ideally we should filter by that. But for now simplified:
                query = query.or(`status.ilike.%hủy%,status.ilike.%cancel%,status.ilike.%từ chối%`)
                    .gte('submit_date', startDate) // Assume relevant to submit month for now as we lack cancel_date column in DB schema setup?
                    .lte('submit_date', endDate)
                    .order('submit_date', { ascending: true });
            } else if (filter === 'pending') {
                query = query.or(`status.ilike.%Pending%,status.ilike.%Chờ%`)
                    .order('submit_date', { ascending: true });
            } else {
                // Default (all): We need COMPREHENSIVE data for the month stats.
                // Contracts Submitted in Month OR Issued in Month.
                // Supabase .or() with complex range is hard. We'll fetch both and merge.

                // 1. Submitted in Month
                const { data: submittedData, error: err1 } = await supabase
                    .from("contracts")
                    .select(`*, agents(full_name, rank, manager_code, manager_name)`)
                    .gte('submit_date', startDate)
                    .lte('submit_date', endDate);

                if (err1) throw err1;

                // 2. Issued in Month
                const { data: issuedData, error: err2 } = await supabase
                    .from("contracts")
                    .select(`*, agents(full_name, rank, manager_code, manager_name)`)
                    .gte('issue_date', startDate)
                    .lte('issue_date', endDate);

                if (err2) throw err2;

                // Merge and Deduplicate by policy_number
                const startMap = new Map();
                (submittedData || []).forEach((c: any) => startMap.set(c.policy_number, c));
                (issuedData || []).forEach((c: any) => {
                    // For Issued Data that was picked up (because issue_date is in month),
                    // If it is CANCELLED, we check if it was SUBMITTED in this month.
                    // If NOT submitted in this month, we exclude it (User Req: "HĐ đã hủy thì không hiển thị tại tháng hủy, chỉ tháng nộp").
                    // If it is NOT cancelled (i.e. Issued, or other), we keep it as "Issued in Month" record.

                    if (c.status === 'Cancelled') {
                        if (c.submit_date && c.submit_date.startsWith(month)) {
                            startMap.set(c.policy_number, c);
                        }
                        // Else: Ignore (don't add to map, effectively hiding it if it wasn't in submittedData)
                    } else {
                        startMap.set(c.policy_number, c);
                    }
                });

                // Sort by submit_date Ascending
                const results = Array.from(startMap.values()).sort((a: any, b: any) => {
                    const dateA = new Date(a.submit_date || 0).getTime();
                    const dateB = new Date(b.submit_date || 0).getTime();
                    return dateA - dateB;
                });

                return NextResponse.json({ data: results });
            }
        }

        const { data, error } = await query;

        if (error) throw error;

        // Process data to flatten agent info
        // And if 'manager_name' is null in agents, we might not get it. 
        // We'll trust the join for now.

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
