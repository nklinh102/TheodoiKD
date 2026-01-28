"use client";

import { useState, useEffect, useMemo } from "react";
import { TeamStructure } from "@/components/agents/team-structure";
import { Agent } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { AgentFormDialog } from "@/components/agents/agent-form-dialog";
import { SelectAgentDialog } from "@/components/agents/select-agent-dialog";

export default function TeamStructurePage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Stats Map
    const [agentStats, setAgentStats] = useState<Record<string, number>>({});

    // Add Subordinate State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedManager, setSelectedManager] = useState<Agent | null>(null);

    useEffect(() => {
        fetchAgents();
        fetchStats();
    }, []);

    async function fetchStats() {
        try {
            const date = new Date();
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

            const res = await fetch(`/api/reports/manager?month=${monthStr}`);
            const result = await res.json();

            if (result.success) {
                const statsMap: Record<string, number> = {};
                result.data.forEach((item: any) => {
                    // Normalize agent code map
                    // Use managerCode from report
                    if (item.managerCode) {
                        statsMap[item.managerCode] = item.stats.totalAgents;
                    }
                    // Also map by group code just in case
                    if (item.groupCode) {
                        statsMap[item.groupCode] = item.stats.totalAgents;
                    }
                });
                setAgentStats(statsMap);
            }
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    }

    async function fetchAgents() {
        try {
            const res = await fetch("/api/agents");
            const result = await res.json();
            if (result.success) {
                setAgents(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch agents", error);
            toast({ title: "Lỗi", description: "Không thể tải dữ liệu", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    // Filter Logic: Only Include Management Ranks
    const filteredAgents = useMemo(() => {
        // Normalize ranks to uppercase to be safe
        const allowedRanks = ['AM', 'BM', 'SDM', 'DM', 'SUM', 'UM', 'SM'];
        return agents.filter(a => a.rank && allowedRanks.includes(a.rank.toUpperCase()));
    }, [agents]);

    // Candidates: Agents within the allowed ranks who DO NOT have a manager yet (or manager is empty)
    // AND are not the selected manager themselves (if any)
    const availableCandidates = useMemo(() => {
        if (!selectedManager) {
            // Root addition: Show everyone (except maybe those already at root, but re-adding them is fine/no-op or move)
            return filteredAgents;
        }

        // If adding to Manager X:
        // Candidates can be anyone EXCEPT:
        // 1. The manager themselves (X)
        // 2. (Optional) Ancestors of X (to avoid cycles) - Skipping for now as it requires complex traversal
        return filteredAgents.filter(a =>
            a.agent_code !== selectedManager.agent_code
        );
    }, [filteredAgents, selectedManager]);

    const handleAddSubordinate = (manager: Agent | null) => {
        setSelectedManager(manager);
        setIsAddOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cấu trúc Khu vực</h1>
                <p className="text-slate-500 mt-1">Sơ đồ phân cấp quản lý (AM - UM).</p>
            </div>

            <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                    <CardTitle>Sơ đồ tổ chức</CardTitle>
                    <CardDescription>Hiển thị và điều chuyển các cấp quản lý.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TeamStructure
                        agents={filteredAgents}
                        agentStats={agentStats}
                        onUpdate={fetchAgents}
                        virtualRootName="Giám đốc Kinh doanh"
                        onAddSubordinate={handleAddSubordinate}
                    />
                </CardContent>
            </Card>

            <SelectAgentDialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                manager={selectedManager}
                candidates={availableCandidates}
                onSuccess={fetchAgents}
            />
        </div>
    );
}
