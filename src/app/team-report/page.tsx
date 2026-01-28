
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamTable, TeamGroupData } from "./components/team-table";

export default function TeamReportPage() {
    const [date, setDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<TeamGroupData[]>([]);

    useEffect(() => {
        fetchData();
    }, [date]);

    async function fetchData() {
        setLoading(true);
        try {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

            const res = await fetch(`/api/reports/team?month=${monthStr}`);
            const result = await res.json();

            if (result.success) {
                setData(result.data);
            } else {
                console.error(result.error);
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch team report", error);
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
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Báo cáo Đội nhóm</h1>
                    <p className="text-slate-500 mt-1">Tổng hợp kết quả kinh doanh theo cấu trúc tổ chức.</p>
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
                        <Users className="w-5 h-5 text-blue-600" />
                        Chi tiết Đội nhóm - Tháng {date.getMonth() + 1}/{date.getFullYear()}
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
                                {/* Submitted Card */}
                                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow py-0">
                                    <CardContent className="p-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-blue-500" /> Nộp
                                            </p>
                                            <div className="p-1.5 bg-blue-50 rounded-full">
                                                <Calendar className="h-4 w-4 text-blue-600" />
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-1.5">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
                                                    data.reduce((sum, g) => sum + g.summary.submittedFYP, 0)
                                                )}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 border-t pt-2">
                                            <p>
                                                <span className="font-semibold text-blue-600">{data.reduce((sum, g) => sum + g.summary.submittedCount, 0)}</span> Hợp đồng nộp
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Issued Card */}
                                <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow py-0">
                                    <CardContent className="p-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <Users className="h-4 w-4 text-green-500" /> Cấp
                                            </p>
                                            <div className="p-1.5 bg-green-50 rounded-full">
                                                <Users className="h-4 w-4 text-green-600" />
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-1.5">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
                                                    data.reduce((sum, g) => sum + g.summary.issuedFYP, 0)
                                                )}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 border-t pt-2">
                                            <p>
                                                <span className="font-semibold text-green-600">{data.reduce((sum, g) => sum + g.summary.issuedCount, 0)}</span> Hợp đồng thực thu
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Pending Card */}
                                <Card className="border-l-4 border-l-orange-400 shadow-sm hover:shadow-md transition-shadow py-0">
                                    <CardContent className="p-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-orange-500" /> Pending
                                            </p>
                                            <div className="p-1.5 bg-orange-50 rounded-full">
                                                <Calendar className="h-4 w-4 text-orange-600" />
                                            </div>
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-1.5">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
                                                    data.reduce((sum, g) => sum + g.summary.pendingFYP, 0)
                                                )}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 border-t pt-2">
                                            <p>
                                                <span className="font-semibold text-orange-600">{data.reduce((sum, g) => sum + g.summary.pendingCount, 0)}</span> Hợp đồng chờ
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <TeamTable data={data} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
