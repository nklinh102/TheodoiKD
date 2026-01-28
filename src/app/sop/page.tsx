"use client";

import { useState } from "react";
import { ImportSopDialog } from "./components/import-sop-dialog";
import { ExportSopDialog } from "./components/export-sop-dialog";
import { SopTable } from "./components/sop-table";

export default function SopPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleImportSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Quản lý Dữ liệu SOP</h1>
                        <p className="text-muted-foreground mt-2">
                            Upload và quản lý dữ liệu SOP (chỉ số đại lý) từ file Excel
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <ImportSopDialog onSuccess={handleImportSuccess} />
                        <ExportSopDialog />
                    </div>
                </div>

                <div className="bg-card rounded-lg border p-6">
                    <SopTable refreshTrigger={refreshTrigger} />
                </div>
            </div>
        </div>
    );
}
