
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ManagerTable, ManagerReportItem } from "./components/manager-table";

export default function ManagerReportPage() {
    const [date, setDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ManagerReportItem[]>([]);

    useEffect(() => {
        fetchData();
    }, [date]);

    async function fetchData() {
        setLoading(true);
        try {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

            const res = await fetch(`/api/reports/manager?month=${monthStr}`);
            const result = await res.json();

            if (result.success) {
                setData(result.data);
            } else {
                console.error(result.error);
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch manager report", error);
        } finally {
            setLoading(false);
        }
    }

    const nextMonth = () => {
        const next = new Date(date);
        next.setMonth(date.getMonth() + 1);
        setDate(next);
    };

    const prevMonth = () => {
        const prev = new Date(date);
        prev.setMonth(date.getMonth() - 1);
        setDate(prev);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Báo cáo Quản lý</h1>
                    <p className="text-slate-500 mt-1">Tổng hợp chỉ số KPI theo từng đội nhóm kinh doanh.</p>
                </div>

                {/* Month Picker - Native Input */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                    <Button variant="ghost" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="relative">
                        <input
                            type="month"
                            value={`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`}
                            onChange={(e) => {
                                if (e.target.value) {
                                    const [y, m] = e.target.value.split('-').map(Number);
                                    const newDate = new Date(y, m - 1, 1);
                                    setDate(newDate);
                                }
                            }}
                            className="h-9 px-3 py-1 border-none focus:ring-0 text-sm font-medium bg-transparent outline-none cursor-pointer"
                        />
                    </div>

                    <Button variant="ghost" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Kết quả kinh doanh - Tháng {date.getMonth() + 1}/{date.getFullYear()}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Summary Box */}
                            {/* Summary Box */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Agents Card */}
                                <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow py-0">
                                    <CardContent className="p-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <Users className="h-4 w-4 text-purple-500" /> Nhân sự
                                            </p>
                                            <div className="p-1.5 bg-purple-50 rounded-full">
                                                <Users className="h-4 w-4 text-purple-600" />
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-1.5">
                                            <span className="text-3xl font-bold text-gray-900">
                                                {data.reduce((sum, item) => sum + item.stats.totalAgents, 0)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">Đại lý</span>
                                        </div>
                                        <div className="space-y-1 text-xs border-t pt-2">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Active:</span>
                                                <span className="font-semibold text-green-600">{data.reduce((sum, item) => sum + item.stats.activeAgents, 0)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Có HĐ:</span>
                                                <span className="font-semibold text-blue-600">{data.reduce((sum, item) => sum + item.stats.submittedAgents, 0)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* FYP Submitted Card */}
                                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow py-0">
                                    <CardContent className="p-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-blue-500" /> FYP Nộp
                                            </p>
                                            <div className="p-1.5 bg-blue-50 rounded-full">
                                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-1.5">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
                                                    data.reduce((sum, item) => sum + item.stats.submittedFYP, 0)
                                                )}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 border-t pt-2">
                                            <p>Doanh số nộp trong tháng.</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* FYP Issued Card */}
                                <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow py-0">
                                    <CardContent className="p-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-green-500" /> FYP Cấp
                                            </p>
                                            <div className="p-1.5 bg-green-50 rounded-full">
                                                <TrendingUp className="h-4 w-4 text-green-600" />
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-1.5">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
                                                    data.reduce((sum, item) => sum + item.stats.issuedFYP, 0)
                                                )}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 border-t pt-2">
                                            <p>Doanh số thực thu (Active).</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <ManagerTable data={data} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
