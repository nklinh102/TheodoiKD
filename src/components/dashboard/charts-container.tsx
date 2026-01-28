"use client";

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartsProps {
    data: any;
}

export function ChartsContainer({ data }: ChartsProps) {
    const { actual, charts } = data;
    const [groupData, setGroupData] = useState<any[]>([]);
    const [saCount, setSaCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Fetch agent group data from SOP
    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                const res = await fetch('/api/sop/groups');
                const result = await res.json();

                if (result.success) {
                    // Định nghĩa màu cho từng nhóm
                    const groupColors: Record<string, string> = {
                        "Manulife Pro Bạch Kim": "#10b981", // Xanh lá cây (emerald)
                        "Manulife Pro Vàng": "#eab308",     // Vàng (yellow)
                        "Manulife Pro Bạc": "#94a3b8",      // Xám (slate)
                        "M0": "#8b5cf6",                     // Tím (purple)
                        "M1-3": "#ec4899",                   // Hồng (pink)
                        "M4-6": "#f59e0b",                   // Cam (amber)
                        "M7-12": "#0ea5e9",                  // Xanh dương (sky)
                        "M13+": "#6366f1"                    // Indigo
                    };

                    const formattedData = result.groups.map((group: any) => ({
                        name: group.name,
                        value: group.count,
                        fill: groupColors[group.name] || "#64748b" // Màu mặc định nếu không có trong danh sách
                    }));

                    setGroupData(formattedData);
                    setSaCount(result.saCount);
                }
            } catch (error) {
                console.error('Lỗi lấy dữ liệu nhóm:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupData();
    }, []);

    // --- Data Preparation ---

    const barData = [
        { name: 'Nộp', count: actual.cc.submitted, fill: '#60a5fa' }, // Light Blue
        { name: 'Cấp', count: actual.cc.issued, fill: '#34d399' }, // Emerald
        { name: 'Pending', count: actual.cc.pending, fill: '#fbbf24' }, // Amber
    ];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-200 shadow-xl rounded-lg text-sm">
                    <p className="font-bold text-slate-700 mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }}></div>
                        <span className="text-slate-500">Số lượng:</span>
                        <span className="font-bold text-slate-800 text-lg">
                            {payload[0].value}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Chart 1: Contracts */}
            <div className="h-[320px] w-full bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Tình hình Hợp đồng (CC)</h4>
                </div>
                <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={barData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }}
                            dy={10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', radius: 8 }} />
                        <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={50}>
                            {barData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                            <LabelList dataKey="count" position="top" fill="#64748b" fontSize={13} fontWeight="bold" offset={10} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Chart 2: Agent Groups from SOP */}
            <div className="h-[320px] w-full bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Thống kê Nhóm Đại lý</h4>
                </div>
                {saCount > 0 && (
                    <p className="text-xs text-slate-500 mb-4">
                        <span className="font-semibold">Ghi chú:</span> Số lượng SA: {saCount}
                    </p>
                )}
                {loading ? (
                    <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                        Đang tải dữ liệu...
                    </div>
                ) : groupData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={groupData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                width={110}
                                tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', radius: 8 }} />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                                {groupData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                                <LabelList dataKey="value" position="right" fill="#64748b" fontSize={12} fontWeight="bold" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                        Chưa có dữ liệu SOP. Vui lòng import file SOP.
                    </div>
                )}
            </div>

        </div>
    );
}
