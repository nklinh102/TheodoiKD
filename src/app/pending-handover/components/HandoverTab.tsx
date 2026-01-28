"use client";

import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HandoverRow {
    stt: string | number;
    msdl: string;
    agentName: string;
    contractNumber: string;
    mainProductCode: string;
    issuanceDate: string;
    daysSinceIssuance: number; // Changed to number for logic
}

interface HandoverTabProps {
    data: HandoverRow[];
    setData: (data: HandoverRow[]) => void;
    fileName: string;
    setFileName: (name: string) => void;
    reportDate: string;
    setReportDate: (date: string) => void;
}

export function HandoverTab({
    data,
    setData,
    fileName,
    setFileName,
    reportDate,
    setReportDate
}: HandoverTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    // Fetch saved data on mount
    React.useEffect(() => {
        const loadSavedData = async () => {
            try {
                const res = await fetch('/api/reports/pending-handover?type=handover');
                const json = await res.json();
                if (json.data && json.data.content) {
                    setData(json.data.content);
                    if (json.data.report_date) {
                        setReportDate(json.data.report_date);
                    }
                }
            } catch (error) {
                console.error("Failed to load saved handover data", error);
            }
        };
        loadSavedData();
    }, [setData, setReportDate]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = async (event) => {
            const bstr = event.target?.result;
            const workbook = XLSX.read(bstr, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            // 1. Try to find Report Date
            let foundDate = "";
            for (let i = 0; i < Math.min(10, rawData.length); i++) {
                const row = rawData[i];
                if (!row) continue;
                for (let j = 0; j < row.length; j++) {
                    const cell = row[j];
                    if (typeof cell === 'string' && cell.toLowerCase().includes("ngày báo cáo")) {
                        const nextCell = row[j + 1];
                        if (nextCell) {
                            if (typeof nextCell === 'number') {
                                const date = new Date((nextCell - (25567 + 2)) * 86400 * 1000);
                                foundDate = date.toLocaleDateString('vi-VN');
                            } else {
                                foundDate = String(nextCell);
                            }
                        }
                        break;
                    }
                }
                if (foundDate) break;
            }
            setReportDate(foundDate);

            // 2. Find header row index
            let headerRowIndex = -1;
            for (let i = 0; i < Math.min(20, rawData.length); i++) {
                const row = rawData[i];
                if (row && row.some((cell: any) => typeof cell === 'string' && (cell.includes("MSDL") || cell.includes("Số HĐ") || cell.includes("Số hợp đồng")))) {
                    headerRowIndex = i;
                    break;
                }
            }

            if (headerRowIndex === -1) {
                alert("Không tìm thấy hàng tiêu đề hợp lệ!");
                return;
            }

            const headers = rawData[headerRowIndex];

            const parsedData: HandoverRow[] = [];

            for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                const row = rawData[i];
                if (!row || row.length === 0) continue;

                const getCol = (keyParts: string[]) => {
                    const index = headers.findIndex((h: any) =>
                        typeof h === 'string' && keyParts.some(k => h.toLowerCase().includes(k.toLowerCase()))
                    );
                    return index !== -1 ? row[index] : "";
                };

                const stt = getCol(['STT']) || "";
                const msdl = getCol(['MSDL', 'Mã số']) || "";
                const agentName = getCol(['Tên đại lý', 'Tên ĐL']) || "";
                const contractNumber = getCol(['Số hợp đồng', 'Số HĐ']) || "";
                const mainProductCode = getCol(['Mã sản phẩm chính']) || "";
                const issuanceDate = getCol(['Ngày cấp HĐ']) || "";
                const daysVal = getCol(['Từ ngày cấp HĐ']); // Keep explicit

                // Parse days safely
                let daysSinceIssuance = 0;
                if (typeof daysVal === 'number') {
                    daysSinceIssuance = daysVal;
                } else if (typeof daysVal === 'string') {
                    daysSinceIssuance = parseInt(daysVal) || 0;
                }

                if (msdl || contractNumber) {
                    parsedData.push({
                        stt,
                        msdl,
                        agentName,
                        contractNumber,
                        mainProductCode,
                        issuanceDate,
                        daysSinceIssuance
                    });
                }
            }
            setData(parsedData);

            // Save to DB
            try {
                await fetch('/api/reports/pending-handover', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'handover',
                        content: parsedData,
                        report_date: foundDate
                    })
                });
            } catch (err) {
                console.error("Failed to save handover data", err);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleDownloadImage = async () => {
        if (!tableRef.current) return;

        try {
            const node = tableRef.current;
            const width = node.scrollWidth;
            const height = node.scrollHeight;

            const dataUrl = await toPng(node, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                pixelRatio: 2,
                width: width,
                height: height,
                style: {
                    overflow: 'visible',
                    maxHeight: 'none',
                    maxWidth: 'none',
                }
            });
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = "Danh_sach_ban_giao_HD.png";
            link.click();
        } catch (error) {
            console.error("Error generating image:", error);
            alert("Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại.");
        }
    };

    const getDaysColor = (days: number) => {
        if (days >= 1 && days <= 7) return "text-green-600 font-bold";
        if (days >= 8 && days <= 17) return "text-orange-600 font-bold";
        if (days >= 18 && days <= 21) return "text-red-600 font-bold";
        if (days >= 22) return "text-purple-800 font-bold"; // Deep purple
        return "text-slate-900";
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        Upload File Bàn Giao HĐ
                    </Button>
                    <Input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                    />
                    <span className="text-sm text-gray-500 italic">
                        {fileName || "Chưa chọn file"}
                    </span>
                </div>

                {data.length > 0 && (
                    <Button
                        onClick={handleDownloadImage}
                        className="flex gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <ImageIcon className="w-4 h-4" />
                        Tải ảnh bảng
                    </Button>
                )}
            </div>

            <div ref={tableRef} className="rounded-md border bg-white shadow-sm overflow-visible p-6">
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold uppercase text-blue-900 tracking-wide">
                        Danh sách Chưa Hoàn Trả Giấy Xác Nhận Bàn Giao Hợp Đồng
                    </h2>
                    {reportDate && (
                        <p className="text-sm text-slate-500 mt-2 italic">
                            Ngày báo cáo: <span className="font-semibold text-slate-700">{reportDate}</span>
                        </p>
                    )}
                </div>

                <div className="border border-blue-200 rounded-md overflow-visible">
                    {/* Using direct table structure to avoid overflow-auto from shadcn Table component */}
                    <div className="w-full overflow-visible">
                        <table className="w-full caption-bottom text-sm">
                            <TableHeader className="bg-blue-900 hover:bg-blue-900">
                                <TableRow className="hover:bg-blue-900 border-b-blue-200 h-[60px]">
                                    <TableHead className="w-[50px] font-bold text-center border-r border-blue-800 text-white align-middle">STT</TableHead>
                                    <TableHead className="font-bold border-r border-blue-800 w-[100px] text-white align-middle">Mã số</TableHead>
                                    <TableHead className="font-bold border-r border-blue-800 w-[180px] text-white align-middle">Tên đại lý</TableHead>
                                    <TableHead className="font-bold border-r border-blue-800 w-[120px] text-white align-middle">Số HĐ</TableHead>
                                    <TableHead className="font-bold border-r border-blue-800 w-[150px] text-white align-middle">Mã sản phẩm chính</TableHead>
                                    <TableHead className="font-bold border-r border-blue-800 w-[120px] text-white align-middle">Ngày cấp HĐ</TableHead>
                                    <TableHead className="font-bold text-center text-white w-[140px] align-middle">Từ ngày cấp HĐ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length > 0 ? (
                                    data.map((row, index) => (
                                        <TableRow key={index} className="even:bg-slate-50 hover:bg-blue-50 border-b border-gray-200">
                                            <TableCell className="text-center border-r border-gray-200 align-top py-3">{row.stt}</TableCell>
                                            <TableCell className="border-r border-gray-200 align-top py-3">{row.msdl}</TableCell>
                                            <TableCell className="font-medium border-r border-gray-200 align-top py-3">{row.agentName}</TableCell>
                                            <TableCell className="border-r border-gray-200 align-top py-3">{row.contractNumber}</TableCell>
                                            <TableCell className="border-r border-gray-200 align-top py-3">{row.mainProductCode}</TableCell>
                                            <TableCell className="border-r border-gray-200 align-top text-center py-3">{row.issuanceDate}</TableCell>
                                            <TableCell className={cn("text-center align-top py-3", getDaysColor(row.daysSinceIssuance))}>
                                                {row.daysSinceIssuance}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                                            Vui lòng upload file để xem dữ liệu
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </table>
                    </div>
                </div>
                {data.length > 0 && (
                    <div className="text-sm text-gray-500 text-right mt-4 italic">
                        Tổng số dòng: {data.length}
                    </div>
                )}
            </div>
        </div>
    );
}
