
"use client";

import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { ContractsTable, Contract } from "./contracts-table";
import { ContractsStats } from "./contracts-stats";
import { ImportContractsDialog } from "./import-contracts-dialog";
import { ExportContractsDialog } from "./export-contracts-dialog";

export default function ContractsView() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [filter, setFilter] = useState<string>("all"); // submitted, issued, pending, all

    const fetchContracts = async () => {
        setLoading(true);
        // Optional: Clear contracts to avoid stale data mismatch if fetch fails?
        // Or keep it to prevent flash? 
        // Best: Clear it if we are confident, or handle error carefully.
        // Let's NOT clears immediately to avoid flash, but ensure we update on success/err.

        try {
            const params = new URLSearchParams();
            if (month) params.append("month", month);
            if (filter !== "all") params.append("filter", filter);

            const res = await fetch(`/api/contracts?${params.toString()}`);
            const data = await res.json();

            if (res.ok && data.data) {
                setContracts(data.data);
            } else {
                console.error("Fetch failed or no data:", data);
                setContracts([]); // Clear if error/empty so user knows
            }
        } catch (error) {
            console.error(error);
            setContracts([]); // Clear on network error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, [month, filter]);

    const stats = useMemo(() => {
        let submitted = 0;
        let submittedAPE = 0;
        let submittedAgents = new Set();
        let submittedFYP = 0;

        let issued = 0;
        let issuedAPE = 0;
        let issuedAgents = new Set();
        let issuedFYP = 0;

        let pending = 0;

        contracts.forEach(c => {
            const isSubmittedInMonth = c.submit_date?.startsWith(month);
            const isIssuedInMonth = c.issue_date?.startsWith(month);
            const isPending = c.status?.toLowerCase().includes("pending") || c.status?.toLowerCase().includes("chờ") || c.status?.toLowerCase().includes("thẩm định");

            if (isSubmittedInMonth) {
                submitted++;
                submittedAPE += c.ape;
                submittedFYP += c.fyp;
                if (c.agent_code) submittedAgents.add(c.agent_code);
            }

            if (isIssuedInMonth) {
                issued++;
                issuedAPE += c.ape;
                issuedFYP += c.fyp;
                if (c.agent_code) issuedAgents.add(c.agent_code);
            }

            if (isPending) {
                pending++;
            }
        });

        return {
            submittedCount: submitted,
            submittedAPE: submittedAPE,
            issuedCount: issued,
            issuedAPE: issuedAPE,
            pendingCount: pending,
            submittedAgents: submittedAgents.size,
            issuedAgents: issuedAgents.size,
            submittedFYP: submittedFYP,
            issuedFYP: issuedFYP
        };
    }, [contracts, month]);

    // Local filter for Table Display
    const filteredContracts = useMemo(() => {
        if (filter === 'all') return contracts;
        if (filter === 'issued') return contracts.filter(c => c.issue_date?.startsWith(month));
        if (filter === 'submitted') return contracts.filter(c => c.submit_date?.startsWith(month));
        if (filter === 'cancelled') return contracts.filter(c => c.status?.toLowerCase().includes("hủy") || c.status?.toLowerCase().includes("cancel") || c.status?.toLowerCase().includes("từ chối"));
        if (filter === 'pending') return contracts.filter(c => c.status?.toLowerCase().includes("pending") || c.status?.toLowerCase().includes("chờ"));
        return contracts;
    }, [contracts, filter, month]);


    // Helper to format month display
    const formatMonthDisplay = (yyyyMM: string) => {
        if (!yyyyMM) return "";
        const [year, month] = yyyyMM.split("-");
        return `Tháng ${month} / ${year}`;
    };

    // Helper to change month
    const adjustMonth = (delta: number) => {
        const date = new Date(month + "-01");
        date.setMonth(date.getMonth() + delta);
        const newMonth = date.toISOString().slice(0, 7);
        setMonth(newMonth);
    };

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Quản lý Hợp đồng</h2>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">Theo dõi chi tiết hợp đồng nộp và cấp hàng tháng.</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <ExportContractsDialog />
                    <ImportContractsDialog onSuccess={fetchContracts} />
                </div>
            </div>

            {/* Controls Section */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-gray-50/50 p-3 md:p-4 rounded-xl border">
                {/* Month Picker - Simplified */}
                <div className="flex items-center justify-between lg:justify-start gap-4 bg-white p-1 rounded-lg border shadow-sm">
                    <Button variant="ghost" size="icon" onClick={() => adjustMonth(-1)} className="h-8 w-8 hover:bg-gray-100">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 min-w-[140px] justify-center font-semibold text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatMonthDisplay(month)}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => adjustMonth(1)} className="h-8 w-8 hover:bg-gray-100">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2">
                    <div className="flex flex-1 items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="hidden sm:inline text-sm text-muted-foreground font-medium mr-1">Lọc theo:</span>
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="flex-1 lg:w-[180px] border-0 shadow-none h-8 p-0 focus:ring-0">
                                <SelectValue placeholder="Chọn bộ lọc" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả hợp đồng</SelectItem>
                                <SelectItem value="submitted">Nộp trong tháng</SelectItem>
                                <SelectItem value="issued">Cấp trong tháng</SelectItem>
                                <SelectItem value="cancelled">Hủy trong tháng</SelectItem>
                                <SelectItem value="pending">Chờ xử lý (Pending)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <ContractsStats stats={stats} />

            <ContractsTable data={filteredContracts} />
        </div>
    );
}
