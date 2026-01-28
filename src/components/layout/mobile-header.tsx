"use client";

import { Menu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
    onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
    return (
        <header className="lg:hidden flex items-center justify-between px-4 h-16 bg-white border-b sticky top-0 z-40">
            <div className="flex items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    IAM System
                </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onMenuClick}>
                <Menu className="w-6 h-6 text-slate-600" />
            </Button>
        </header>
    );
}
