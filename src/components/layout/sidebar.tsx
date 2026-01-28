"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    FileText,
    Target,
    Settings,
    ShieldCheck,
    Network,
    TrendingUp,
    FileClock,
    Database,
    Award,
    Trophy
} from "lucide-react";

const navigation = [
    { name: "Tổng quan", href: "/", icon: LayoutDashboard },
    { name: "Đại lý", href: "/agents", icon: Users },
    { name: "Cấu trúc khu vực", href: "/team-structure", icon: Network },
    { name: "Hợp đồng", href: "/contracts", icon: FileText },
    { name: "Dữ liệu SOP", href: "/sop", icon: Database },
    { name: "Theo dõi MDRT", href: "/mdrt", icon: Award },
    { name: "Theo dõi Manulife Pro", href: "/manulife-pro", icon: Trophy },
    { name: "Báo cáo Đội nhóm", href: "/team-report", icon: Target },
    { name: "Báo cáo Quản lý", href: "/manager-report", icon: TrendingUp },
    { name: "Cài đặt Chỉ tiêu", href: "/settings/targets", icon: Settings },
    { name: "Pending & Bàn giao", href: "/pending-handover", icon: FileClock },
];

interface SidebarProps {
    onClose?: () => void;
    className?: string;
}

export function Sidebar({ onClose, className }: SidebarProps) {
    const pathname = usePathname();

    return (
        <div className={cn("w-64 bg-white border-r flex flex-col h-full", className)}>
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        IAM System
                    </span>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5",
                                isActive ? "text-blue-600" : "text-slate-400"
                            )} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t mt-auto text-xs text-slate-400 text-center">
                v1.0.0 &copy; 2024 Insurance System
            </div>
        </div>
    );
}
