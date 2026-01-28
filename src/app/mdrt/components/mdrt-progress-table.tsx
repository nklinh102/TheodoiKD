"use client";

import { useEffect, useState } from "react";

interface ProgressData {
    month: string;
    target: number;
    monthName: string;
}

export function MdrtProgressTable() {
    const [data, setData] = useState<ProgressData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/mdrt/progress');
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (error) {
                console.error('Lỗi lấy tiến độ MDRT:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const currentMonth = new Date().toISOString().slice(0, 7).replace('-', '/');

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    if (loading) {
        return <div className="text-center py-8 text-white">Đang tải...</div>;
    }

    return (
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="border-b border-emerald-500/30">
                            {data.map((item) => (
                                <th key={item.month} className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider bg-emerald-700/50">
                                    {item.month}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            {data.map((item) => {
                                const isCurrent = item.month === currentMonth;
                                return (
                                    <td
                                        key={item.month}
                                        className={`px-4 py-3 text-center text-sm tabular-nums border-r border-emerald-500/20 last:border-r-0 ${isCurrent
                                            ? 'bg-emerald-500/30 font-bold text-white'
                                            : 'text-emerald-50'
                                            }`}
                                    >
                                        {formatNumber(item.target)}
                                    </td>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
