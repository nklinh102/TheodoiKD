
"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingTab, PendingRow } from "./components/PendingTab";
import { HandoverTab, HandoverRow } from "./components/HandoverTab";

export default function PendingHandoverPage() {
    // Lifted state for Pending Tab
    const [pendingData, setPendingData] = useState<PendingRow[]>([]);
    const [pendingFileName, setPendingFileName] = useState<string>("");

    // Lifted state for Handover Tab
    const [handoverData, setHandoverData] = useState<HandoverRow[]>([]);
    const [handoverFileName, setHandoverFileName] = useState<string>("");
    const [reportDate, setReportDate] = useState<string>("");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pending & Bàn giao HĐ</h1>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-[400px] grid-cols-2">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="handover">Bàn giao HĐ</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                    <PendingTab
                        data={pendingData}
                        setData={setPendingData}
                        fileName={pendingFileName}
                        setFileName={setPendingFileName}
                    />
                </TabsContent>
                <TabsContent value="handover" className="mt-4">
                    <HandoverTab
                        data={handoverData}
                        setData={setHandoverData}
                        fileName={handoverFileName}
                        setFileName={setHandoverFileName}
                        reportDate={reportDate}
                        setReportDate={setReportDate}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
