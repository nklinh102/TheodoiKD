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

interface ImportSopDialogProps {
    onSuccess: () => void;
}

export function ImportSopDialog({ onSuccess }: ImportSopDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<string>("update");
    const [uploadDate, setUploadDate] = useState<string>("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            // Không cần extract ngày từ tên file nữa
            // Ngày sẽ được tự động lấy từ cột "Ngày chốt dữ liệu" trong file Excel
            setUploadDate(""); // Để trống để API tự động detect
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("mode", mode);
        if (uploadDate) {
            formData.append("uploadDate", uploadDate);
        }

        try {
            const res = await fetch("/api/import/sop", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Import thất bại");
            }

            alert(`Import thành công! Đã import ${data.count} bản ghi SOP (Ngày: ${data.uploadDate})`);

            setOpen(false);
            setFile(null);
            setUploadDate("");
            onSuccess();
        } catch (error: any) {
            console.error(error);
            alert(`Lỗi import: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Import Dữ liệu SOP</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Import Dữ liệu SOP</DialogTitle>
                    <DialogDescription>
                        Chọn file Excel (.xlsx) chứa dữ liệu SOP của các đại lý.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="file" className="text-right">
                            File Excel
                        </Label>
                        <Input
                            id="file"
                            type="file"
                            accept=".xlsx, .xls"
                            className="col-span-3"
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="uploadDate" className="text-right">
                            Ngày dữ liệu
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="uploadDate"
                                type="date"
                                value={uploadDate}
                                onChange={(e) => setUploadDate(e.target.value)}
                                placeholder="Tự động lấy từ file"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Để trống để tự động lấy từ cột "Ngày chốt dữ liệu" trong file
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Chế độ</Label>
                        <div className="col-span-3 flex flex-col gap-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="mode-update"
                                    name="mode"
                                    value="update"
                                    checked={mode === 'update'}
                                    onChange={(e) => setMode(e.target.value)}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="mode-update" className="font-normal">
                                    Cập nhật (Thêm mới/Cập nhật bản ghi trùng)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="mode-replace"
                                    name="mode"
                                    value="replace"
                                    checked={mode === 'replace'}
                                    onChange={(e) => setMode(e.target.value)}
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="mode-replace" className="font-normal text-destructive">
                                    Thay thế toàn bộ (Xóa hết dữ liệu cũ)
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleImport} disabled={loading || !file}>
                        {loading ? "Đang import..." : "Import"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
