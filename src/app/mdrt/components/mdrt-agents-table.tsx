"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface AgentData {
    agent_code: string;
    full_name: string;
    rank: string;
    fyp_issued: number;
    progress_percent: number;
    remaining_fyp: number;
}

// Context for sharing filter state
interface FilterContextType {
    filter: string | null;
    setFilter: (filter: string | null) => void;
    uploadDate: string | null;
    setUploadDate: (date: string | null) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function MdrtProvider({ children }: { children: ReactNode }) {
    const [filter, setFilter] = useState<string | null>(null);
    const [uploadDate, setUploadDate] = useState<string | null>(null);

    return (
        <FilterContext.Provider value={{ filter, setFilter, uploadDate, setUploadDate }}>
            {children}
        </FilterContext.Provider>
    );
}

function useMdrtFilter() {
    const context = useContext(FilterContext);
    if (context === undefined) {
        throw new Error("useMdrtFilter must be used within a MdrtProvider");
    }
    return context;
}

// Filter Buttons Component
export function FilterButtons() {
    const { filter, setFilter } = useMdrtFilter();

    return (
        <div className="flex justify-end gap-2">
            <Button
                onClick={() => setFilter(null)}
                size="sm"
                variant={filter === null ? "default" : "outline"}
                className={`text-xs ${filter === null ? "bg-blue-600 hover:bg-blue-700" : "border-blue-400 text-blue-300 hover:bg-blue-900/30"}`}
            >
                Toàn bộ
            </Button>
            <Button
                onClick={() => setFilter("10")}
                size="sm"
                variant={filter === "10" ? "default" : "outline"}
                className={`text-xs ${filter === "10" ? "bg-blue-600 hover:bg-blue-700" : "border-blue-400 text-blue-300 hover:bg-blue-900/30"}`}
            >
                Top 10
            </Button>
            <Button
                onClick={() => setFilter("15")}
                size="sm"
                variant={filter === "15" ? "default" : "outline"}
                className={`text-xs ${filter === "15" ? "bg-blue-600 hover:bg-blue-700" : "border-blue-400 text-blue-300 hover:bg-blue-900/30"}`}
            >
                Top 15
            </Button>
            <Button
                onClick={() => setFilter("20")}
                size="sm"
                variant={filter === "20" ? "default" : "outline"}
                className={`text-xs ${filter === "20" ? "bg-blue-600 hover:bg-blue-700" : "border-blue-400 text-blue-300 hover:bg-blue-900/30"}`}
            >
                Top 20
            </Button>
        </div>
    );
}

// Table Only Component
export function TableOnly() {
    const { filter, setUploadDate } = useMdrtFilter();
    const [data, setData] = useState<AgentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState<any>({});

    const fetchData = async (limit: string | null = null) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (limit) params.append('limit', limit);

            const res = await fetch(`/api/mdrt/agents?${params.toString()}`);
            const result = await res.json();
            if (result.success) {
                setData(result.data);
                setMeta(result.meta);
                if (result.meta.uploadDate) {
                    setUploadDate(result.meta.uploadDate);
                }
            }
        } catch (error) {
            console.error('Lỗi lấy dữ liệu agents:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(filter);
    }, [filter]);

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(Math.round(num));
    };

    const getProgressColor = (percent: number) => {
        if (percent >= 50) return 'bg-emerald-500';
        if (percent >= 25) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getProgressTextColor = (percent: number) => {
        if (percent >= 50) return 'text-emerald-400';
        if (percent >= 25) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 rounded-xl shadow-2xl overflow-hidden border border-blue-700/30">
            {loading ? (
                <div className="text-center py-12 text-blue-200">Đang tải dữ liệu...</div>
            ) : (
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-blue-700/50 bg-blue-900/50">
                                <th className="px-4 py-3 text-center text-xs font-bold text-blue-100 uppercase tracking-wide">STT</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-blue-100 uppercase tracking-wide">Mã Số</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-blue-100 uppercase tracking-wide">Tên Đại Lý</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-blue-100 uppercase tracking-wide">Rank</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-blue-100 uppercase tracking-wide">FYP Cấp 2026</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-blue-100 uppercase tracking-wide">% Tiến Độ Tháng {meta.month || ''}</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-blue-100 uppercase tracking-wide">FYP Còn Thiếu<br />Tiến Độ Tháng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((agent, index) => (
                                <tr
                                    key={agent.agent_code}
                                    className="border-b border-blue-700/20 hover:bg-blue-800/30 transition-colors"
                                >
                                    <td className="px-4 py-3 text-sm text-blue-100">
                                        <div className="flex justify-center">
                                            {index < 3 ? (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500 text-yellow-900' :
                                                    index === 1 ? 'bg-gray-300 text-gray-800' :
                                                        'bg-orange-600 text-orange-100'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                            ) : (
                                                <span className="text-blue-300">{index + 1}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-blue-200 font-mono">{agent.agent_code}</td>
                                    <td className="px-4 py-3 text-sm text-white font-medium">{agent.full_name}</td>
                                    <td className="px-4 py-3 text-sm text-blue-200">{agent.rank}</td>
                                    <td className="px-4 py-3 text-sm text-right tabular-nums">
                                        <span className={agent.fyp_issued > 0 ? 'text-emerald-400 font-semibold' : 'text-blue-400'}>
                                            {formatNumber(agent.fyp_issued)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-blue-950/50 rounded-full h-6 overflow-hidden border border-blue-700/30">
                                                    <div
                                                        className={`h-full ${getProgressColor(agent.progress_percent)} transition-all duration-500 flex items-center justify-end pr-2`}
                                                        style={{ width: `${Math.min(100, agent.progress_percent)}%` }}
                                                    >
                                                        {agent.progress_percent >= 15 && (
                                                            <span className="text-xs font-bold text-white">
                                                                {agent.progress_percent.toFixed(0)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {agent.progress_percent < 15 && (
                                                    <span className={`text-xs font-bold ${getProgressTextColor(agent.progress_percent)} min-w-[45px] text-right`}>
                                                        {agent.progress_percent.toFixed(0)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right tabular-nums">
                                        <span className="text-red-400 font-semibold">
                                            {formatNumber(agent.remaining_fyp)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Main export with sub-components
export const MdrtAgentsTable = {
    Provider: MdrtProvider,
    FilterButtons,
    TableOnly,
    useMdrtFilter
};
