"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopListsProps {
    data: any;
}

export function TopLists({ data }: TopListsProps) {
    const { top_lists } = data;
    const { fyp, cc, fyp_issued, cc_issued } = top_lists;

    return (
        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top FYP */}
            <TopListCard
                title="Top 10 Doanh số (FYP)"
                icon={<Trophy className="h-6 w-6 text-yellow-500 drop-shadow-sm" />}
                dataSubmitted={fyp}
                dataIssued={fyp_issued || []}
                type="fyp"
                headerBorder="border-yellow-200"
            />

            {/* Top Contracts */}
            <TopListCard
                title="Top 10 Hợp đồng (CC)"
                icon={<Medal className="h-6 w-6 text-blue-500 drop-shadow-sm" />}
                dataSubmitted={cc}
                dataIssued={cc_issued || []}
                type="cc"
                headerBorder="border-blue-200"
            />
        </div>
    );
}

function TopListCard({ title, icon, dataSubmitted, dataIssued, type, headerBorder }: any) {
    return (
        <Card className="border-none shadow-md h-full flex flex-col overflow-hidden ring-1 ring-slate-100">
            <CardHeader className={cn("pb-4 bg-white border-b-2", headerBorder)}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-full border border-slate-100">
                        {icon}
                    </div>
                    <CardTitle className="text-base font-extrabold text-slate-800 uppercase tracking-tight">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 bg-white">
                <Tabs defaultValue="submitted" className="w-full h-full flex flex-col">
                    <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
                        <TabsList className="grid w-full grid-cols-2 h-9">
                            <TabsTrigger
                                value="submitted"
                                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-xs font-semibold text-slate-500"
                            >
                                Nộp (Submitted)
                            </TabsTrigger>
                            <TabsTrigger
                                value="issued"
                                className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-xs font-semibold text-slate-500"
                            >
                                Cấp (Issued)
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="submitted" className="mt-0 flex-1 overflow-auto max-h-[500px]">
                        <TopListTable data={dataSubmitted} type={type} metricKey={type === 'fyp' ? 'fyp_submitted' : 'cc_submitted'} />
                    </TabsContent>
                    <TabsContent value="issued" className="mt-0 flex-1 overflow-auto max-h-[500px]">
                        <TopListTable data={dataIssued} type={type} metricKey={type === 'fyp' ? 'fyp_issued' : 'cc_issued'} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

function TopListTable({ data, type, metricKey }: any) {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'decimal', maximumFractionDigits: 0 }).format(val);

    return (
        <Table>
            <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                    <TableHead className="w-[60px] text-center font-bold text-slate-600 h-10 text-xs uppercase">Hạng</TableHead>
                    <TableHead className="font-bold text-slate-600 h-10 text-xs uppercase">Thành viên</TableHead>
                    <TableHead className="text-right font-bold text-slate-600 h-10 text-xs uppercase">
                        {type === 'fyp' ? 'Doanh số' : 'Số lượng'}
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data && data.length > 0 ? (
                    data.map((agent: any, index: number) => (
                        <TableRow key={agent.agent_code || index} className="group hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0 h-12">
                            <TableCell className="text-center font-medium">
                                <RankBadge index={index} />
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{agent.name}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{agent.agent_code}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-800 text-sm">
                                {type === 'fyp'
                                    ? <span className="text-emerald-600">{formatCurrency(agent[metricKey])}</span>
                                    : <span className="text-blue-600">{agent[metricKey]}</span>}
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center py-12 text-slate-400 italic">
                            Chưa có dữ liệu
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

function RankBadge({ index }: { index: number }) {
    if (index === 0) return (
        <div className="mx-auto w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-md flex items-center justify-center text-white">
            <Crown className="w-4 h-4 fill-white" />
        </div>
    );
    if (index === 1) return (
        <div className="mx-auto w-7 h-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 shadow-sm flex items-center justify-center text-white text-xs font-bold">
            2
        </div>
    );
    if (index === 2) return (
        <div className="mx-auto w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-700 shadow-sm flex items-center justify-center text-white text-xs font-bold">
            3
        </div>
    );
    return <span className="text-slate-400 font-semibold text-sm">{index + 1}</span>;
}
