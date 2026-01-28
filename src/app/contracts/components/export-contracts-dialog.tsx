
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";

export function ExportContractsDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<"all" | "month">("month");

    // Default to current month
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [month, setMonth] = useState(currentMonthStr);

    const handleExport = async () => {
        setLoading(true);
        try {
            const param = type === "all" ? "all" : month;
            const response = await fetch(`/api/export/contracts?month=${param}`);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Export failed");
            }

            // Create blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Danh_sach_HD_${param}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setOpen(false);
        } catch (error: any) {
            console.error("Export error:", error);
            alert("Lỗi xuất file: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                    <Download className="w-4 h-4" />
                    Xuất Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Xuất danh sách hợp đồng</DialogTitle>
                    <DialogDescription>
                        Chọn bộ lọc để xuất dữ liệu ra file Excel.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <RadioGroup value={type} onValueChange={(v) => setType(v as "all" | "month")}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="r1" />
                            <Label htmlFor="r1">Tất cả thời gian</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="month" id="r2" />
                            <Label htmlFor="r2">Theo tháng nộp</Label>
                        </div>
                    </RadioGroup>

                    {type === "month" && (
                        <div className="pl-6">
                            <Input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="w-[200px]"
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleExport} disabled={loading}>
                        {loading ? "Đang xuất..." : "Tải về"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
