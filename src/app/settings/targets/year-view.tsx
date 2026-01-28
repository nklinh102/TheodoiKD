"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function YearView({ year }: { year: string }) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (year) fetchYearData();
    }, [year]);

    const fetchYearData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/targets?year=${year}`);
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch year data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = (index: number, field: string, value: any) => {
        const newData = [...data];
        newData[index] = { ...newData[index], [field]: Number(value) };
        setData(newData);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Must save each changed month. Simplest strategy: Save all promises parallel.
            const promises = data.map(item =>
                fetch('/api/targets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                })
            );

            await Promise.all(promises);
            alert("Đã lưu thành công cho cả năm!");
        } catch (error) {
            console.error(error);
            alert("Lỗi khi lưu dữ liệu");
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'decimal', maximumFractionDigits: 0 }).format(val);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold text-slate-800">Bảng Tổng quan Năm {year}</CardTitle>
                <Button onClick={handleSave} disabled={saving || loading}>
                    {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Lưu Toàn Bộ
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[100px]">Tháng</TableHead>
                                    <TableHead className="text-right">FYP Target</TableHead>
                                    <TableHead className="text-right">Active Target</TableHead>
                                    <TableHead className="text-right">Thực đạt FYP</TableHead>
                                    <TableHead className="text-right">Thực đạt Active</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((item, index) => (
                                    <TableRow key={item.month}>
                                        <TableCell className="font-bold text-slate-700">
                                            Tháng {item.month.split('-')[1]}
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="text"
                                                value={item.fyp_target ? new Intl.NumberFormat('vi-VN').format(item.fyp_target) : '0'}
                                                onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/\./g, '');
                                                    if (!isNaN(Number(rawValue))) {
                                                        handleUpdate(index, 'fyp_target', rawValue);
                                                    }
                                                }}
                                                className="text-right font-bold text-slate-900"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={item.active_target || 0}
                                                onChange={(e) => handleUpdate(index, 'active_target', e.target.value)}
                                                className="text-right"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="text"
                                                disabled
                                                value={item.actual_fyp ? new Intl.NumberFormat('vi-VN').format(item.actual_fyp) : '0'}
                                                className="text-right text-slate-500 bg-slate-50"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                disabled
                                                value={item.actual_active || 0}
                                                className="text-right text-slate-500 bg-slate-50"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableBody className="bg-slate-50 border-t-2 border-slate-200">
                                <TableRow>
                                    <TableCell className="font-extrabold text-slate-800 uppercase">Tổng Năm</TableCell>
                                    <TableCell className="text-right font-extrabold text-slate-800">
                                        {formatCurrency(data.reduce((sum, item) => sum + (Number(item.fyp_target) || 0), 0))}
                                    </TableCell>
                                    <TableCell className="text-right font-extrabold text-slate-800">
                                        {data.reduce((sum, item) => sum + (Number(item.active_target) || 0), 0)}
                                    </TableCell>
                                    <TableCell className="text-right font-extrabold text-emerald-600">
                                        {formatCurrency(data.reduce((sum, item) => sum + (Number(item.actual_fyp) || 0), 0))}
                                    </TableCell>
                                    <TableCell className="text-right font-extrabold text-emerald-600">
                                        {data.reduce((sum, item) => sum + (Number(item.actual_active) || 0), 0)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
