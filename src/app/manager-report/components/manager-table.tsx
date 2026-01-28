
"use client";

import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export interface ManagerReportItem {
    groupCode: string;
    managerName: string;
    managerCode: string;
    managerRank: string;
    stats: {
        totalAgents: number;
        submittedAgents: number;
        activeAgents: number;
        activePercent: number;
        fypTarget: number;
        submittedFYP: number;
        issuedFYP: number;
        completionPercent: number;
    };
}

interface ManagerTableProps {
    data: ManagerReportItem[];
}

export function ManagerTable({ data }: ManagerTableProps) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
    };

    const formatPercent = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 }).format(val / 100);
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[50px] font-bold text-center">STT</TableHead>
                        <TableHead className="font-bold">Quản lý</TableHead>
                        <TableHead className="font-bold">Mã số</TableHead>
                        <TableHead className="font-bold">Rank</TableHead>
                        <TableHead className="font-bold">Mã tổ</TableHead>

                        <TableHead className="text-center font-bold text-purple-600">Tổng ĐL</TableHead>
                        <TableHead className="text-center font-bold text-blue-600">ĐL Nộp</TableHead>
                        <TableHead className="text-center font-bold text-green-600">ĐL Active</TableHead>
                        <TableHead className="text-center font-bold text-green-800">% Active</TableHead>

                        <TableHead className="text-right font-bold text-slate-600">Target</TableHead>
                        <TableHead className="text-right font-bold text-blue-600">FYP Nộp</TableHead>
                        <TableHead className="text-right font-bold text-green-600">FYP Cấp</TableHead>
                        <TableHead className="text-right font-bold text-green-800">% Target</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? (
                        data.map((item, index) => (
                            <TableRow key={item.groupCode}>
                                <TableCell className="text-center text-slate-500">{index + 1}</TableCell>
                                <TableCell className="font-medium text-slate-900">{item.managerName}</TableCell>
                                <TableCell>{item.managerCode}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                        {item.managerRank}
                                    </Badge>
                                </TableCell>
                                <TableCell>{item.groupCode}</TableCell>

                                <TableCell className="text-center font-medium">{item.stats.totalAgents}</TableCell>
                                <TableCell className="text-center font-medium text-blue-600">{item.stats.submittedAgents}</TableCell>
                                <TableCell className="text-center font-medium text-green-600">{item.stats.activeAgents}</TableCell>
                                <TableCell className="text-center font-bold text-green-800">{formatPercent(item.stats.activePercent)}</TableCell>

                                <TableCell className="text-right text-slate-500">{item.stats.fypTarget > 0 ? formatCurrency(item.stats.fypTarget) : "-"}</TableCell>
                                <TableCell className="text-right text-blue-700 font-medium">{formatCurrency(item.stats.submittedFYP)}</TableCell>
                                <TableCell className="text-right text-green-700 font-bold">{formatCurrency(item.stats.issuedFYP)}</TableCell>
                                <TableCell className="text-right font-bold text-green-800">
                                    {item.stats.fypTarget > 0 ? formatPercent(item.stats.completionPercent) : "-"}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={13} className="h-24 text-center">
                                Không có dữ liệu cho tháng này.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
