"use client";

import { useState } from "react";
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
    Trophy,
    ChevronLeft,
    ChevronRight
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
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className={cn(
            "bg-white border-r flex flex-col h-full transition-all duration-300",
            isCollapsed ? "w-[70px]" : "w-64",
            className
        )}>
            <div className={cn(
                "p-6 flex items-center justify-between",
                isCollapsed && "p-4 justify-center"
            )}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <ShieldCheck className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    <span className={cn(
                        "text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent transition-opacity duration-300 whitespace-nowrap",
                        isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                    )}>
                        IAM System
                    </span>
                </div>
            </div>

            <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto overflow-x-hidden">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            title={isCollapsed ? item.name : undefined}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                                isCollapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 flex-shrink-0",
                                isActive ? "text-blue-600" : "text-slate-400"
                            )} />
                            <span className={cn(
                                "transition-opacity duration-300 whitespace-nowrap",
                                isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                            )}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Toggle Button for Desktop */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex absolute -right-3 top-20 bg-white border rounded-full p-1 shadow-md text-slate-400 hover:text-blue-600 cursor-pointer z-50"
            >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <div className={cn(
                "p-4 border-t mt-auto text-xs text-slate-400 text-center overflow-hidden whitespace-nowrap",
                isCollapsed && "hidden"
            )}>
                v1.0.0 &copy; 2024 Insurance System
            </div>
        </div>
    );
}
