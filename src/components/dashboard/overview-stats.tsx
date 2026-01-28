"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Users, FileText, Target, DollarSign, TrendingUp, UserPlus, FileCheck, Clock, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewStatsProps {
    data: any;
}

export function OverviewStats({ data }: OverviewStatsProps) {
    const { targets, actual, today } = data;

    // Helpers
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);

    const calcPercent = (val: number, target: number) =>
        target > 0 ? ((val / target) * 100).toFixed(1) : "0.0";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. FYP Card - Gradient Green/Emerald */}
                <StatCard
                    title="FYP THỰC ĐẠT (ISSUED)"
                    value={formatCurrency(actual.fyp.issued)}
                    icon={<DollarSign className="h-6 w-6 text-white" />}
                    trend={`${calcPercent(actual.fyp.issued, targets.fyp)}% Target`}
                    trendUp={actual.fyp.issued >= targets.fyp}
                    description={`Mục tiêu: ${formatCurrency(targets.fyp)}`}
                    gradient="bg-gradient-to-br from-emerald-500 to-green-600"
                    textColor="text-white"
                    subTextColor="text-emerald-100"
                />

                {/* 2. Contracts Card - Gradient Blue */}
                <StatCard
                    title="HỢP ĐỒNG (ISSUED)"
                    value={actual.cc.issued.toString()}
                    icon={<FileCheck className="h-6 w-6 text-white" />}
                    trend={`${today.issuedCount || 0} hôm nay`}
                    trendUp={true}
                    description={`Nộp: ${actual.cc.submitted} | Pending: ${actual.cc.pending}`}
                    gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                    textColor="text-white"
                    subTextColor="text-blue-100"
                />

                {/* 3. Manpower Card - Gradient Violet */}
                <StatCard
                    title="NHÂN SỰ (ACTIVE / TOTAL)"
                    value={`${actual.manpower.active || 0} / ${actual.manpower.total}`}
                    icon={<Users className="h-6 w-6 text-white" />}
                    trend="Nhân sự hoạt động"
                    trendUp={true}
                    description={`Tuyển mới: ${actual.recruitment.new_recruits}`}
                    gradient="bg-gradient-to-br from-violet-500 to-purple-600"
                    textColor="text-white"
                    subTextColor="text-violet-100"
                />

                {/* 4. Submitted FYP - Gradient Orange */}
                <StatCard
                    title="FYP NỘP (SUBMITTED)"
                    value={formatCurrency(actual.fyp.submitted)}
                    icon={<TrendingUp className="h-6 w-6 text-white" />}
                    trend={`${calcPercent(actual.fyp.submitted, targets.fyp)}% Target`}
                    trendUp={false}
                    description="Doanh số đang chờ phát hành"
                    gradient="bg-gradient-to-br from-orange-400 to-pink-500"
                    textColor="text-white"
                    subTextColor="text-orange-100"
                />
            </div>

            {/* Daily Stats Row - Clean white styling with colored borders/accents if needed, or simple clean look */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Hoạt động trong ngày</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <MiniStatBox label="Số HĐ nộp" value={today.submittedCount || 0} color="text-blue-600" />
                    <MiniStatBox label="Số HĐ cấp" value={today.issuedCount || 0} color="text-green-600" />
                    <MiniStatBox label="FYP nộp" value={formatCurrency(today.fypSubmitted || 0)} color="text-orange-600" />
                    <MiniStatBox label="FYP cấp" value={formatCurrency(today.fypIssued || 0)} color="text-emerald-600" />
                    <MiniStatBox label="FYP Pending" value={formatCurrency(actual.fyp.pending || 0)} color="text-purple-600" />
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, trendUp, description, gradient, textColor, subTextColor }: any) {
    return (
        <Card className={cn("border-none shadow-lg relative overflow-hidden group", gradient)}>
            {/* Decorative circle */}
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors" />
            <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors" />

            <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <span className={cn("text-xs font-bold opacity-90 tracking-wider", subTextColor)}>{title}</span>
                        <div className="flex items-baseline gap-1">
                            <span className={cn("text-2xl lg:text-3xl font-bold tracking-tight", textColor)}>{value}</span>
                        </div>
                    </div>
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        {icon}
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs">
                    <div className={cn("flex items-center gap-1 font-bold bg-white/20 px-2 py-1 rounded", textColor)}>
                        {trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {trend}
                    </div>
                    <div className={cn("text-right opacity-80 font-medium", subTextColor)}>
                        {description}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function MiniStatBox({ label, value, color }: any) {
    return (
        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
            <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase text-center">{label}</span>
            <span className={cn("text-sm md:text-base font-bold mt-1", color)}>{value}</span>
        </div>
    )
}
