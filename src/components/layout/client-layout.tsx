"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 flex-col lg:flex-row">
            {/* Mobile Header */}
            <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />

            {/* Sidebar with mobile overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden",
                    isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsSidebarOpen(false)}
            />

            <Sidebar
                className={cn(
                    "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-auto",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}
