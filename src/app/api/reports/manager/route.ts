
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Agent, Contract } from "@/types/database";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // YYYY-MM

        if (!month) {
            return NextResponse.json({ error: "Month is required" }, { status: 400 });
        }

        const [year, m] = month.split('-').map(Number);
        const startDate = `${month}-01`;
        const lastDay = new Date(year, m, 0).getDate();
        const endDate = `${month}-${lastDay}`;

        // 1. Fetch All Agents
        const { data: agents, error: agentsError } = await supabase
            .from("agents")
            .select("*");

        if (agentsError) throw agentsError;

        // 2. Fetch Relevant Contracts
        const { data: contracts, error: contractsError } = await supabase
            .from("contracts")
            .select("*")
            .or(`submit_date.gte.${startDate},issue_date.gte.${startDate},status.eq.Pending`);

        if (contractsError) throw contractsError;

        // 3. Process Data strictly following Team Report Logic
        const groups: Record<string, Agent[]> = {};
        const getGroup = (a: Agent) => (a.group_code || a.manager_code || "Unknown").trim().toUpperCase();

        (agents as Agent[]).forEach(agent => {
            const g = getGroup(agent);
            if (!groups[g]) groups[g] = [];
            groups[g].push(agent);
        });

        // Create a map for fast agent lookup (Normalize Key)
        const agentsMap = new Map<string, Agent>();
        (agents as Agent[]).forEach(a => {
            if (a.agent_code) {
                agentsMap.set(a.agent_code.trim().toUpperCase(), a);
            }
        });

        // 4. Fetch Allocations for Target
        const { data: allocations, error: allocError } = await supabase
            .from("team_allocations")
            .select("manager_code, fyp_target")
            .eq("month", month);

        // Map allocation
        const targetMap = new Map<string, number>();
        if (allocations) {
            allocations.forEach((a: any) => {
                targetMap.set(a.manager_code, Number(a.fyp_target));
            });
        }

        const reports = [];

        for (const [groupCode, groupAgents] of Object.entries(groups)) {
            // Identify manager: Find the agent in the group who has a Manager Rank
            // User request: "các QL có chức danh: UM, SUM, DM, SDM, BM, AM, SM"
            const validManagerRanks = ['UM', 'SUM', 'DM', 'SDM', 'BM', 'AM', 'SM'];

            // Find finding the highest ranking member? Or just the one with these ranks?
            // Usually there is only 1 Leader with such rank per group.
            let manager = groupAgents.find(a => {
                const r = (a.rank || "").trim().toUpperCase();
                return validManagerRanks.includes(r);
            });

            // FALLBACK: If manager not found within the group agents (e.g. SM's Direct Team where SM is in parent group)
            // 1. Try to find the manager using the Group Code as Agent Code from the global map
            if (!manager) {
                let potentialManager = agentsMap.get(groupCode);

                // 2. If not found via Group Code, try the manager_code of the members
                // (This is common for "Direct Teams" where Group Code is just a Unit ID, not the Manager's ID)
                if (!potentialManager && groupAgents.length > 0) {
                    // Find the first member with a manager_code
                    const memberWithManager = groupAgents.find(a => a.manager_code);
                    if (memberWithManager && memberWithManager.manager_code) {
                        potentialManager = agentsMap.get(memberWithManager.manager_code.trim().toUpperCase());
                    }
                }

                if (potentialManager) {
                    const r = (potentialManager.rank || "").trim().toUpperCase();
                    if (validManagerRanks.includes(r)) {
                        manager = potentialManager;
                    }
                }
            }

            // STRICT FILTER: 
            if (!manager) {
                // No manager with High Rank found in this group -> Skip
                // EXCEPTION: Check if this is the Special SM Group (Leader D2647)
                // Since D2647 might correspond to "TT SM" with Rank "Ter", we manually check.
                if (groupCode === 'D2647' || (groupAgents.length > 0 && groupAgents[0].manager_code === 'D2647')) {
                    const specialSM = agentsMap.get('D2647');
                    if (specialSM) {
                        manager = specialSM;
                    }
                }

                if (!manager) continue;
            }

            const status = (manager.status || "").toLowerCase();
            // Whitelist D2647 from status check if needed, though 'Terminated' is usually skipped.
            // If user wants "TT SM" (Ter) to show, we must skip this check for D2647.
            if (manager.agent_code !== 'D2647' && (status === 'terminated' || status === 'ter' || status.includes('nghỉ'))) {
                continue;
            }

            const managerRank = (manager.rank || "").trim().toUpperCase();
            // Whitelist D2647 from Rank check
            if (manager.agent_code !== 'D2647' && !validManagerRanks.includes(managerRank)) {
                continue;
            }

            const isSM = manager.agent_code === 'D2647' || managerRank === 'SM';

            // FILTER MEMBERS (Team Report Logic)
            // Define Manager Ranks
            const highRanks = ['UM', 'SUM', 'DM', 'SDM', 'BM', 'AM', 'SM'];

            // Filter members: Keep if Rank is High Rank OR Rank is FA.
            let validMembers = groupAgents.filter(a => {
                const r = (a.rank || "").toUpperCase();
                return highRanks.includes(r) || r === 'FA';
            });

            // Manager is already in groupAgents, so already in validMembers if Rank is High.

            // NOTE: Team Report includes Manager in the list.
            // EXCLUDE SM from count (SM should not be counted in headcount)
            const totalAgents = validMembers.filter(a => {
                const r = (a.rank || "").trim().toUpperCase();
                return r !== 'SM';
            }).length;

            // Stats Aggregation
            let submittedAgentCount = 0;
            let activeAgentCount = 0; // Issued
            let submittedFYP = 0;
            let issuedFYP = 0;

            validMembers.forEach(agent => {
                const agentContracts = (contracts as Contract[]).filter(c => c.agent_code === agent.agent_code);

                let hasSubmission = false;
                let hasIssuance = false;

                agentContracts.forEach(c => {
                    const isSubmittedInMonth = c.submit_date >= startDate && c.submit_date <= endDate;
                    // Issued logic: issue_date in month AND not cancelled
                    const isIssuedInMonth = c.issue_date && c.issue_date >= startDate && c.issue_date <= endDate && c.status !== 'Cancelled';

                    if (isSubmittedInMonth) {
                        hasSubmission = true;
                        submittedFYP += Number(c.fyp || 0);
                    }
                    if (isIssuedInMonth) {
                        hasIssuance = true;
                        issuedFYP += Number(c.fyp || 0);
                    }
                });

                if (hasSubmission) submittedAgentCount++;
                if (hasIssuance) activeAgentCount++;
            });

            // Target mapping
            // Priority: direct manager code match
            const mgrCode = manager ? manager.agent_code : groupCode;
            const fypTarget = targetMap.get(mgrCode) || 0;
            const completionPercent = fypTarget > 0 ? (issuedFYP / fypTarget) * 100 : 0;
            const activePercent = totalAgents > 0 ? (activeAgentCount / totalAgents) * 100 : 0;

            reports.push({
                groupCode,
                managerName: manager ? manager.full_name : "N/A",
                managerCode: mgrCode,
                managerRank: isSM ? "SM" : manager.rank,

                stats: {
                    totalAgents,
                    submittedAgents: submittedAgentCount,
                    activeAgents: activeAgentCount,
                    activePercent,

                    fypTarget,
                    submittedFYP,
                    issuedFYP,
                    completionPercent
                }
            });
        }

        // Sort by Manager Name (or whatever default)
        reports.sort((a, b) => a.managerName.localeCompare(b.managerName));

        return NextResponse.json({
            success: true,
            data: reports
        });

    } catch (error: any) {
        console.error("Manager Report Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
