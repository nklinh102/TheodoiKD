
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
        // Last day of month
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

        // 3. Process Data
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

        const responseData = [];

        for (const [groupCode, groupAgents] of Object.entries(groups)) {
            // Identify manager: Find the agent in the group who has a Manager Rank
            const validManagerRanks = ['UM', 'SUM', 'DM', 'SDM', 'BM', 'AM', 'SM'];

            let manager = groupAgents.find(a => {
                const r = (a.rank || "").trim().toUpperCase();
                return validManagerRanks.includes(r);
            });

            // FALLBACK: If manager not found within the group
            if (!manager) {
                let potentialManager = agentsMap.get(groupCode);

                // Try member's manager_code
                if (!potentialManager && groupAgents.length > 0) {
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

            // EXCEPTION: Special SM Group (Leader D2647)
            if (!manager) {
                if (groupCode === 'D2647' || (groupAgents.length > 0 && groupAgents[0].manager_code === 'D2647')) {
                    const specialSM = agentsMap.get('D2647');
                    if (specialSM) {
                        manager = specialSM;
                    }
                }
            }

            // Note: In Team Report, we might want to keep "Ghost" groups (no manager found)?
            // The previous logic allowed them if they existed. But usually report requires a structure.
            // If user said "loại bỏ những tổ ter", we should follow.
            // But let's be safe: If no manager found, we default to GroupCode as name?
            // "Tổ trực tiếp + Name". If no Name, maybe just "Tổ trực tiếp [Code]"?

            // Allow processing even if manager is missing?
            // Previous code:
            // if (manager) { check status } else { check? }

            if (manager) {
                const status = (manager.status || "").toLowerCase();
                if (manager.agent_code !== 'D2647' && (status === 'terminated' || status === 'ter' || status.includes('nghỉ'))) {
                    continue; // Skip terminated managers
                }
            } else {
                // If the group has members but no valid manager found:
                // Do we keep or skip?
                // Most likely skip if we want strict reporting.
                // However, previous code comments were ambiguous.
                // Let's Skip to be consistent with Manager Report.
                continue;
            }

            // Define Manager Ranks
            const managerRanks = ['UM', 'SUM', 'DM', 'SDM', 'BM', 'AM', 'SA', 'SM'];
            const highRanks = ['UM', 'SUM', 'DM', 'SDM', 'BM', 'AM', 'SM'];

            // Filter members
            let filteredMembers = groupAgents.filter(a => {
                const r = (a.rank || "").toUpperCase();
                return highRanks.includes(r) || r === 'FA';
            });

            // Sort logic
            filteredMembers.sort((a, b) => {
                const rankA = (a.rank || "").toUpperCase();
                const rankB = (b.rank || "").toUpperCase();

                const isHighA = highRanks.includes(rankA);
                const isHighB = highRanks.includes(rankB);

                if (isHighA && !isHighB) return -1; // A first
                if (!isHighA && isHighB) return 1;  // B first

                const dateA = a.join_date ? new Date(a.join_date).getTime() : 0;
                const dateB = b.join_date ? new Date(b.join_date).getTime() : 0;
                return dateA - dateB;
            });

            const groupItems = filteredMembers;

            // Calculate stats for group summary
            const groupStats = {
                submittedCount: 0,
                issuedCount: 0,
                pendingCount: 0,
                submittedFYP: 0,
                issuedFYP: 0,
                pendingFYP: 0
            };

            const processedItems = groupItems.map(agent => {
                // Contracts for this agent
                const agentContracts = (contracts as Contract[]).filter(c => c.agent_code === agent.agent_code);

                // Stats
                let submittedCount = 0;
                let issuedCount = 0;
                let pendingCount = 0;
                let submittedFYP = 0;
                let issuedFYP = 0;
                let pendingFYP = 0;

                agentContracts.forEach(c => {
                    const isSubmittedInMonth = c.submit_date >= startDate && c.submit_date <= endDate;
                    const isIssuedInMonth = c.issue_date && c.issue_date >= startDate && c.issue_date <= endDate && c.status !== 'Cancelled';
                    const isPending = c.status === 'Pending' || c.status.toLowerCase().includes('chờ');

                    if (isSubmittedInMonth) {
                        submittedCount++;
                        submittedFYP += Number(c.fyp || 0);
                    }
                    if (isIssuedInMonth) {
                        issuedCount++;
                        issuedFYP += Number(c.fyp || 0);
                    }
                    if (isPending) {
                        pendingCount++;
                        pendingFYP += Number(c.fyp || 0);
                    }
                });

                // Add to Group Totals
                groupStats.submittedCount += submittedCount;
                groupStats.issuedCount += issuedCount;
                groupStats.pendingCount += pendingCount;
                groupStats.submittedFYP += submittedFYP;
                groupStats.issuedFYP += issuedFYP;
                groupStats.pendingFYP += pendingFYP;

                // Working Months
                let workingMonths = 0;
                if (agent.join_date) {
                    const join = new Date(agent.join_date);
                    const reportMonth = new Date(year, m - 1, 15);
                    workingMonths = (year - join.getFullYear()) * 12 + ((m - 1) - join.getMonth());
                    if (workingMonths < 0) workingMonths = 0;
                }

                return {
                    agent,
                    stats: {
                        workingMonths,
                        submittedCount,
                        issuedCount,
                        pendingCount,
                        submittedFYP,
                        issuedFYP,
                        pendingFYP
                    }
                };
            });

            // Push to response
            if (processedItems.length > 0) {
                responseData.push({
                    groupCode,
                    managerName: manager ? manager.full_name : "",
                    summary: groupStats,
                    items: processedItems
                });
            }
        }

        // Sort groups by groupCode?
        responseData.sort((a, b) => a.groupCode.localeCompare(b.groupCode));

        return NextResponse.json({
            success: true,
            data: responseData
        });

    } catch (error: any) {
        console.error("Team Report Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
