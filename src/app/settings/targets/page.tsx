"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Loader2, Calendar, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YearView } from "./year-view";

// Internal Component for Currency Input
const CurrencyInput = ({
    value,
    onChange,
    className,
    disabled = false
}: {
    value: number | undefined;
    onChange: (val: number) => void;
    className?: string;
    disabled?: boolean;
}) => {
    // Format number to string with commas
    const format = (val: number | undefined) => {
        if (val === undefined || val === null) return "";
        return new Intl.NumberFormat('vi-VN').format(val);
    };

    const [displayValue, setDisplayValue] = useState(format(value));

    // Update display when external prop changes
    useEffect(() => {
        setDisplayValue(format(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove non-digit characters
        const rawValue = e.target.value.replace(/\./g, '');

        if (rawValue === "") {
            setDisplayValue("");
            onChange(0);
            return;
        }

        if (!/^\d+$/.test(rawValue)) return; // Only allow digits

        const numValue = parseInt(rawValue, 10);
        setDisplayValue(new Intl.NumberFormat('vi-VN').format(numValue));
        onChange(numValue);
    };

    return (
        <Input
            type="text"
            value={displayValue}
            onChange={handleChange}
            className={className}
            disabled={disabled}
            placeholder="0"
        />
    );
};

export default function TargetsPage() {
    const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [viewMode, setViewMode] = useState("detail"); // detail | year
    const year = month.split('-')[0];

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Global Data
    const [globalTarget, setGlobalTarget] = useState({
        fyp_target: 0,
        active_target: 0,
        actual_fyp: 0,
        actual_active: 0
    });

    // Allocations Data
    const [allocations, setAllocations] = useState<any[]>([]);
    // Available Managers
    const [managers, setManagers] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
        fetchManagers();
    }, [month]);

    const fetchManagers = async () => {
        try {
            const res = await fetch(`/api/reports/manager?month=${month}`);
            const result = await res.json();

            if (result.success) {
                const managersFromReport = result.data.map((r: any) => ({
                    agent_code: r.managerCode,
                    full_name: r.managerName,
                    rank: r.managerRank,
                    total_agents: r.stats.totalAgents
                }));

                const uniqueManagers = managersFromReport.filter((v: any, i: number, a: any[]) =>
                    a.findIndex((t: any) => t.agent_code === v.agent_code) === i
                );

                setManagers(uniqueManagers);
            }
        } catch (e) {
            console.error("Failed to fetch managers", e);
        }
    }

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/targets?month=${month}`);
            const result = await res.json();

            if (result.success) {
                setGlobalTarget(result.data.global);
                setAllocations(result.data.allocations);
            }
        } catch (error) {
            console.error("Failed to fetch targets", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Save Global
            await fetch('/api/targets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month,
                    ...globalTarget
                })
            });

            // 2. Save Allocations
            await fetch('/api/targets/allocations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month,
                    allocations: allocations
                })
            });

            alert("Đã lưu thành công!");
        } catch (error) {
            console.error(error);
            alert("Lỗi khi lưu dữ liệu");
        } finally {
            setSaving(false);
        }
    };

    const updateAllocation = (managerCode: string, field: 'fyp_target' | 'active_target', value: any) => {
        setAllocations(prev => {
            const existing = prev.find(a => a.manager_code === managerCode);
            if (existing) {
                return prev.map(a => a.manager_code === managerCode ? { ...a, [field]: Number(value) } : a);
            } else {
                return [...prev, { month, manager_code: managerCode, [field]: Number(value) }];
            }
        });
    };

    // Calculate totals
    const totalAllocatedFYP = allocations.reduce((sum, a) => sum + (Number(a.fyp_target) || 0), 0);
    const totalAllocatedActive = allocations.reduce((sum, a) => sum + (Number(a.active_target) || 0), 0);

    const mergedList = managers
        .map(m => {
            const alloc = allocations.find(a => a.manager_code === m.agent_code) || { fyp_target: 0, active_target: 0 };
            return { ...m, ...alloc };
        })
        .filter(m =>
            m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.agent_code?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => b.fyp_target - a.fyp_target);

    return (
        <div className="space-y-6 container mx-auto py-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cài đặt Chỉ tiêu</h1>
                    <p className="text-slate-500 mt-1">Phân bổ chỉ tiêu kinh doanh cho các nhóm.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="w-[180px] bg-white"
                    />
                </div>
            </div>

            <Tabs defaultValue="detail" className="w-full">
                <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-4">
                    <TabsTrigger value="detail">Chi tiết Tháng {month}</TabsTrigger>
                    <TabsTrigger value="year">Tổng quan Năm {year}</TabsTrigger>
                </TabsList>

                <TabsContent value="detail" className="space-y-6">

                    {/* Global Target & Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Chỉ tiêu Tổng (Global)</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">
                                        {new Intl.NumberFormat('vi-VN').format(globalTarget.fyp_target)}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">FYP Target</p>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">
                                        {new Intl.NumberFormat('vi-VN').format(globalTarget.active_target)}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Active Target</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Đã Phân Bổ</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className={`text-2xl font-bold ${totalAllocatedFYP > globalTarget.fyp_target ? 'text-orange-600' : 'text-green-600'}`}>
                                        {new Intl.NumberFormat('vi-VN').format(totalAllocatedFYP)}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {totalAllocatedFYP > globalTarget.fyp_target ? 'Vượt chỉ tiêu tổng' : 'Trong hạn mức'}
                                    </p>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-700">
                                        {new Intl.NumberFormat('vi-VN').format(totalAllocatedActive)}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Tổng Active các nhóm</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>


                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div>
                                <CardTitle className="text-lg font-medium">Phân bổ theo Quản lý</CardTitle>
                                <CardDescription>Nhập chỉ tiêu cho từng trưởng nhóm bên dưới.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Tìm tên hoặc mã..."
                                        className="pl-8 h-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleSave} disabled={saving} className="ml-2">
                                    {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                                    Lưu Thay Đổi
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="border-t">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="w-[100px] font-semibold text-slate-700">Mã số</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Tên Trưởng nhóm</TableHead>
                                            <TableHead className="w-[100px] font-semibold text-slate-700">Chức danh (Rank)</TableHead>
                                            <TableHead className="w-[100px] text-center font-semibold text-slate-700">SL Đại lý</TableHead>
                                            <TableHead className="w-[200px] text-right font-semibold text-slate-700">Chỉ tiêu FYP</TableHead>
                                            <TableHead className="w-[150px] text-right font-semibold text-slate-700">Chỉ tiêu Active</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mergedList.map((manager: any) => (
                                            <TableRow key={manager.agent_code} className="hover:bg-slate-50/50">
                                                <TableCell className="font-mono text-slate-600 font-medium text-xs">{manager.agent_code}</TableCell>
                                                <TableCell className="font-medium text-slate-900">{manager.full_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                                                        {manager.rank}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center font-medium">{manager.total_agents}</TableCell>
                                                <TableCell>
                                                    <CurrencyInput
                                                        value={manager.fyp_target || 0}
                                                        onChange={(val) => updateAllocation(manager.agent_code, 'fyp_target', val)}
                                                        className="text-right font-mono"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        value={manager.active_target || 0}
                                                        onChange={(e) => updateAllocation(manager.agent_code, 'active_target', e.target.value)}
                                                        className="text-right font-mono"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {mergedList.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                                    Không tìm thấy Trưởng nhóm nào cho tháng này.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="year" className="mt-6">
                    <YearView year={year} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
