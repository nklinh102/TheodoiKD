"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Users, Target, Loader2, ChevronRight, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
    agent_code: string;
    full_name: string;
    rank: string;
    manager_code: string;
    level: number;
    fyp: number;
}

interface TeamPerformance {
    personalFyp: number;
    teamFyp: number;
    activeAgents: number;
    totalTeamSize: number;
}

export default function TeamReportPage() {
    const [managerCode, setManagerCode] = useState("");
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<TeamPerformance | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

    const handleSearch = async () => {
        if (!managerCode || !month) return;

        setLoading(true);
        try {
            const response = await fetch(
                `/api/reports/team?manager_code=${managerCode}&month=${month}`
            );
            const result = await response.json();

            if (result.success) {
                setSummary(result.data.summary);
                setTeamMembers(result.data.team_members);
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error fetching team report:", error);
            alert("Failed to fetch team report");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const getRankColor = (rank: string) => {
        const colors: Record<string, string> = {
            FA: "bg-blue-100 text-blue-700",
            UM: "bg-green-100 text-green-700",
            SUM: "bg-yellow-100 text-yellow-700",
            DM: "bg-orange-100 text-orange-700",
            SDM: "bg-purple-100 text-purple-700",
        };
        return colors[rank] || "bg-slate-100 text-slate-700";
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">
                    Báo cáo Đội nhóm
                </h1>
                <p className="text-slate-500 mt-2">
                    Phân tích hiệu suất toàn bộ đội nhóm theo cấu trúc phân cấp (Recursive Hierarchy)
                </p>
            </div>

            {/* Search Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Tìm kiếm báo cáo</CardTitle>
                    <CardDescription>Nhập mã quản lý và tháng để xem báo cáo chi tiết</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Input
                            placeholder="Mã quản lý (VD: MGR001)"
                            value={managerCode}
                            onChange={(e) => setManagerCode(e.target.value)}
                            className="max-w-xs"
                        />
                        <Input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="max-w-xs"
                        />
                        <Button onClick={handleSearch} disabled={loading || !managerCode}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang tải...
                                </>
                            ) : (
                                <>
                                    <Search className="w-4 h-4 mr-2" />
                                    Tra cứu
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">FYP Cá nhân</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700">
                                {formatCurrency(summary.personalFyp)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">FYP Đội nhóm</CardTitle>
                            <Users className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-700">
                                {formatCurrency(summary.teamFyp)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Đại lý Active</CardTitle>
                            <Target className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-700">
                                {summary.activeAgents}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Có doanh số trong tháng
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Tổng quy mô</CardTitle>
                            <Users className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-700">
                                {summary.totalTeamSize}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Tổng số đại lý trong đội
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Team Members Table */}
            {teamMembers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Chi tiết đội nhóm</CardTitle>
                        <CardDescription>
                            Danh sách toàn bộ đại lý cấp dưới (F1, F2, F3...)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã ĐL</TableHead>
                                    <TableHead>Họ tên</TableHead>
                                    <TableHead>Cấp bậc</TableHead>
                                    <TableHead>Cấp độ</TableHead>
                                    <TableHead className="text-right">FYP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teamMembers.map((member) => (
                                    <TableRow key={member.agent_code} className={cn(
                                        member.level === 1 ? "bg-slate-50/50" : "bg-transparent",
                                        "hover:bg-blue-50/30 transition-colors"
                                    )}>
                                        <TableCell className="font-mono text-sm py-3">
                                            <div className="flex items-center gap-2">
                                                {member.level > 1 && (
                                                    <div
                                                        className="border-l-2 border-b-2 border-slate-200 rounded-bl-lg w-4 h-4 -mt-2 ml-2"
                                                        style={{ marginLeft: `${(member.level - 1) * 16}px` }}
                                                    />
                                                )}
                                                {member.agent_code}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{member.full_name}</span>
                                                <span className="text-[10px] text-slate-400 font-normal">
                                                    Quản lý: {member.manager_code || "N/A"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(getRankColor(member.rank), "shadow-none border-none")}>
                                                {member.rank}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    member.level === 1 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    F{member.level}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-900">
                                            {formatCurrency(member.fyp)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
