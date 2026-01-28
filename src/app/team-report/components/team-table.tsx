
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
import { Agent } from "@/types/database";

// Define the shape of the data returned by the API
export interface TeamReportItem {
    agent: Agent;
    stats: {
        workingMonths: number;
        submittedCount: number;
        issuedCount: number;
        pendingCount: number;
        submittedFYP: number;
        issuedFYP: number;
        pendingFYP: number;
    };
}

export interface TeamGroupData {
    groupCode: string;
    managerName?: string;
    summary: {
        submittedCount: number;
        issuedCount: number;
        pendingCount: number;
        submittedFYP: number;
        issuedFYP: number;
        pendingFYP: number;
    };
    items: TeamReportItem[];
}

interface TeamTableProps {
    data: TeamGroupData[]; // Changed to array of Groups
}

export function TeamTable({ data }: TeamTableProps) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[50px] font-bold text-center">STT</TableHead>
                        <TableHead className="font-bold">Họ tên Đại lý</TableHead>
                        <TableHead className="font-bold">Mã số</TableHead>
                        <TableHead className="font-bold">Rank</TableHead>
                        <TableHead className="font-bold">Mã tổ</TableHead>
                        <TableHead className="text-center font-bold">Tháng LV</TableHead>

                        <TableHead className="text-right font-bold text-blue-600">HĐ Nộp</TableHead>
                        <TableHead className="text-right font-bold text-blue-600">FYP Nộp</TableHead>

                        <TableHead className="text-right font-bold text-green-600">HĐ Cấp</TableHead>
                        <TableHead className="text-right font-bold text-green-600">FYP Cấp</TableHead>

                        <TableHead className="text-right font-bold text-orange-600">Pending</TableHead>
                        <TableHead className="text-right font-bold text-orange-600">FYP Pending</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? (
                        data.map((group, groupIndex) => (
                            <React.Fragment key={group.groupCode}>
                                {/* Group Summary Row */}
                                <TableRow key={`summary-${group.groupCode}`} className="bg-yellow-50 hover:bg-yellow-100 font-bold border-t-2 border-slate-200">
                                    <TableCell colSpan={6} className="text-left pl-4 text-slate-800 uppercase">
                                        {group.managerName ? (
                                            <>
                                                <span className="font-normal">Tổ trực tiếp</span> {group.managerName}
                                            </>
                                        ) : (
                                            `Tổng nhóm ${group.groupCode}`
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">{group.summary.submittedCount}</TableCell>
                                    <TableCell className="text-right text-blue-700">{formatCurrency(group.summary.submittedFYP)}</TableCell>

                                    <TableCell className="text-right">{group.summary.issuedCount}</TableCell>
                                    <TableCell className="text-right text-green-700">{formatCurrency(group.summary.issuedFYP)}</TableCell>

                                    <TableCell className="text-right">{group.summary.pendingCount}</TableCell>
                                    <TableCell className="text-right text-orange-700">{formatCurrency(group.summary.pendingFYP)}</TableCell>
                                </TableRow>

                                {/* Agent Rows */}
                                {group.items.map((item, index) => {
                                    // Check if Manager (Rank based or Group Code)
                                    const highRanks = ['UM', 'SUM', 'DM', 'SDM', 'BM', 'AM'];
                                    const isManager = highRanks.includes(item.agent.rank) || item.agent.agent_code === group.groupCode;

                                    return (
                                        <TableRow
                                            key={item.agent.agent_code}
                                            className={isManager ? "bg-slate-100 font-semibold border-b-2 border-slate-100" : ""}
                                        >
                                            <TableCell className="text-center text-slate-500">{index + 1}</TableCell>
                                            <TableCell className={isManager ? "font-bold text-slate-900" : "font-medium"}>
                                                {item.agent.full_name} {isManager && "(Quản lý)"}
                                            </TableCell>
                                            <TableCell>{item.agent.agent_code}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={isManager ? "bg-blue-600 text-white border-none" : "bg-slate-100 text-slate-700"}>
                                                    {item.agent.rank}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{item.agent.group_code}</TableCell>
                                            <TableCell className="text-center">{item.stats.workingMonths}</TableCell>

                                            <TableCell className="text-right font-medium">{item.stats.submittedCount}</TableCell>
                                            <TableCell className="text-right text-slate-600">{formatCurrency(item.stats.submittedFYP)}</TableCell>

                                            <TableCell className="text-right font-medium">{item.stats.issuedCount}</TableCell>
                                            <TableCell className="text-right text-green-700 font-semibold">{formatCurrency(item.stats.issuedFYP)}</TableCell>

                                            <TableCell className="text-right font-medium">{item.stats.pendingCount}</TableCell>
                                            <TableCell className="text-right text-orange-700">{formatCurrency(item.stats.pendingFYP)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </React.Fragment>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={12} className="h-24 text-center">
                                Không có dữ liệu cho tháng này.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
