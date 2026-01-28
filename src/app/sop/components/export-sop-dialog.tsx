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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";

export function ExportSopDialog() {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [uploadDate, setUploadDate] = useState<string>("");

    const handleExport = async () => {
        setLoading(true);

        try {
            const params = new URLSearchParams();
            if (uploadDate) {
                params.append("uploadDate", uploadDate);
            }

            const res = await fetch(`/api/export/sop?${params.toString()}`);

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Export thất bại");
            }

            // Tải file
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = uploadDate
                ? `SOP_Data_${uploadDate.replace(/-/g, '')}.xlsx`
                : `SOP_Data_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert("Export thành công!");
            setOpen(false);
        } catch (error: any) {
            console.error(error);
            alert(`Lỗi export: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Dữ liệu SOP
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Dữ liệu SOP</DialogTitle>
                    <DialogDescription>
                        Xuất dữ liệu SOP ra file Excel. Để trống để xuất tất cả dữ liệu.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exportDate" className="text-right">
                            Ngày dữ liệu
                        </Label>
                        <Input
                            id="exportDate"
                            type="date"
                            value={uploadDate}
                            onChange={(e) => setUploadDate(e.target.value)}
                            className="col-span-3"
                            placeholder="Để trống để xuất tất cả"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleExport} disabled={loading}>
                        {loading ? "Đang export..." : "Export"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
