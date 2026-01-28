
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
// If use-toast is hook based
// import { useToast } from "@/components/ui/use-toast";

interface ImportContractsDialogProps {
    onSuccess: () => void;
}

export function ImportContractsDialog({ onSuccess }: ImportContractsDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<string>("update");
    // const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("mode", mode);

        try {
            const res = await fetch("/api/import/contracts", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Import failed");
            }

            // toast({
            //     title: "Import thành công",
            //     description: `Đã import ${data.count} hợp đồng`,
            // });
            alert(`Import thành công! Đã import ${data.count} hợp đồng`);

            setOpen(false);
            onSuccess();
        } catch (error: any) {
            console.error(error);
            // toast({
            //     variant: "destructive",
            //     title: "Lỗi import",
            //     description: error.message,
            // });
            alert(`Lỗi import: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Import Hợp đồng</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import Danh sách Hợp đồng</DialogTitle>
                    <DialogDescription>
                        Chọn file Excel (.xlsx) chứa danh sách hợp đồng (HĐ nộp cấp).
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
                                    Cập nhật (Thêm mới/Cập nhật HĐ trùng)
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
