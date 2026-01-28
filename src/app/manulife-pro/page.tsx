"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManulifeProBonusTable } from "./components/manulife-pro-bonus-table";
import { Trophy, TrendingUp, ShieldCheck } from "lucide-react";

export default function ManulifeProPage() {
    const [activeTab, setActiveTab] = useState("bonus");

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative z-10 text-center space-y-2 mb-10">
                    <h1 className="text-4xl font-bold text-slate-900 whitespace-nowrap uppercase tracking-wider">
                        Theo dõi Manulife Pro
                    </h1>
                    <div className="h-1.5 w-48 bg-emerald-500 mx-auto rounded-full"></div>
                    <p className="text-sm text-emerald-600 mt-4 uppercase font-bold tracking-widest">
                        Quản lý danh hiệu & thưởng đại lý Pro
                    </p>
                </div>

                {/* Navigation Tabs */}
                <Tabs defaultValue="bonus" className="w-full" onValueChange={setActiveTab}>
                    <div className="flex justify-center mb-8">
                        <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full md:w-[600px] h-auto p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                            <TabsTrigger
                                value="bonus"
                                className="flex items-center gap-2 py-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all rounded-lg text-slate-500"
                            >
                                <Trophy className="w-4 h-4" />
                                Theo dõi thưởng
                            </TabsTrigger>
                            <TabsTrigger
                                value="promotion"
                                className="flex items-center gap-2 py-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all rounded-lg text-slate-500"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Theo dõi thăng hạng
                            </TabsTrigger>
                            <TabsTrigger
                                value="maintenance"
                                className="flex items-center gap-2 py-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all rounded-lg text-slate-500"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Theo dõi duy trì
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="bonus" className="focus-visible:outline-none">
                        <ManulifeProBonusTable />
                    </TabsContent>

                    <TabsContent value="promotion" className="focus-visible:outline-none">
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 italic shadow-sm">
                            Tính năng "Theo dõi thăng hạng" đang phát triển...
                        </div>
                    </TabsContent>

                    <TabsContent value="maintenance" className="focus-visible:outline-none">
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 italic shadow-sm">
                            Tính năng "Theo dõi duy trì" đang phát triển...
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
