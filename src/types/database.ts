export type Rank = 'FA' | 'UM' | 'SUM' | 'DM' | 'SDM' | 'BM' | 'AM' | 'SA' | 'SM' | 'Ter';
export type ContractStatus = 'Pending' | 'Issued' | 'Ack' | 'Cancelled';
export type AgentStatus = 'Active' | 'Terminated' | 'Pending' | 'Hold';

export interface Agent {
    agent_code: string;
    full_name: string;
    rank: Rank;
    manager_code?: string;
    join_date: string;
    status: AgentStatus;
    team_code?: string;
    dob?: string;
    phone?: string;
    email?: string;
    id_card?: string;
    address?: string;
    bank_account?: string;
    bank_name?: string;
    tax_code?: string;
    office_code?: string;
    recruiter_code?: string;
    manager_name?: string; // Stored name from Import
    group_code?: string; // Explicit group code (Mã tổ)
    created_at?: string;
    updated_at?: string;
}

export interface Contract {
    policy_number: string;
    agent_code: string;
    customer_name: string;
    product_code?: string;
    submit_date: string;
    issue_date?: string;
    fyp: number;
    ape: number;
    status: ContractStatus;
    created_at?: string;
    updated_at?: string;
}

export interface KPITarget {
    id: number;
    agent_code: string;
    month: string; // YYYY-MM
    target_fyp: number;
    target_recruitment: number;
    created_at?: string;
}
