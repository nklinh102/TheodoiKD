import { supabase } from './supabase';

export interface TeamPerformance {
    personalFyp: number;
    teamFyp: number;
    activeAgents: number;
    totalTeamSize: number;
}

export interface TeamMember {
    agent_code: string;
    full_name: string;
    rank: string;
    manager_code: string;
    level: number;
}

/**
 * Get all downline agents for a given manager using recursive hierarchy
 */
export async function getTeamHierarchy(managerCode: string): Promise<TeamMember[]> {
    const { data, error } = await supabase.rpc('get_team_hierarchy', {
        manager_agent_code: managerCode,
    });

    if (error) {
        console.error('Error fetching team hierarchy:', error);
        throw error;
    }

    return data || [];
}

/**
 * Calculate team performance metrics for a specific month
 */
export async function calculateTeamPerformance(
    managerCode: string,
    month: string // Format: YYYY-MM
): Promise<TeamPerformance> {
    const { data, error } = await supabase.rpc('calculate_team_performance', {
        manager_agent_code: managerCode,
        report_month: month,
    });

    if (error) {
        console.error('Error calculating team performance:', error);
        throw error;
    }

    if (!data || data.length === 0) {
        return {
            personalFyp: 0,
            teamFyp: 0,
            activeAgents: 0,
            totalTeamSize: 0,
        };
    }

    const result = data[0];
    return {
        personalFyp: parseFloat(result.personal_fyp) || 0,
        teamFyp: parseFloat(result.team_fyp) || 0,
        activeAgents: result.active_agents || 0,
        totalTeamSize: result.total_team_size || 0,
    };
}

/**
 * Get detailed breakdown of team members with their individual FYP
 */
export async function getTeamMembersWithFyp(
    managerCode: string,
    month: string
): Promise<Array<TeamMember & { fyp: number }>> {
    // First get all team members
    const teamMembers = await getTeamHierarchy(managerCode);

    if (teamMembers.length === 0) {
        return [];
    }

    // Get FYP for each team member
    const agentCodes = teamMembers.map(m => m.agent_code);

    const { data: contracts, error } = await supabase
        .from('contracts')
        .select('agent_code, fyp')
        .in('agent_code', agentCodes)
        .ilike('submit_date', `${month}%`)
        .in('status', ['Issued', 'Ack']);

    if (error) {
        console.error('Error fetching contracts:', error);
        throw error;
    }

    // Aggregate FYP by agent
    const fypByAgent = new Map<string, number>();
    contracts?.forEach(contract => {
        const current = fypByAgent.get(contract.agent_code) || 0;
        fypByAgent.set(contract.agent_code, current + (contract.fyp || 0));
    });

    // Combine team members with their FYP
    return teamMembers.map(member => ({
        ...member,
        fyp: fypByAgent.get(member.agent_code) || 0,
    }));
}
