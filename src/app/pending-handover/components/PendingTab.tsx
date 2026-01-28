"use client";

import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Image as ImageIcon } from "lucide-react";

export interface PendingRow {
    stt: string | number;
    msdl: string;
    agentName: string;
    contractNumber: string;
    submissionDate: string;
    pendingReason: string;
    latestAppraisalRequest: string;
}

interface PendingTabProps {
    data: PendingRow[];
    setData: (data: PendingRow[]) => void;
    fileName: string;
    setFileName: (name: string) => void;
}

export function PendingTab({ data, setData, fileName, setFileName }: PendingTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    // Fetch saved data on mount
    React.useEffect(() => {
        const loadSavedData = async () => {
            try {
                const res = await fetch('/api/reports/pending-handover?type=pending');
                const json = await res.json();
                if (json.data && json.data.content) {
                    setData(json.data.content);
                    // maybe set filename/date if stored
                }
            } catch (error) {
                console.error("Failed to load saved pending data", error);
            }
        };
        loadSavedData();
    }, [setData]);

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

            let headerRowIndex = -1;
            for (let i = 0; i < Math.min(20, rawData.length); i++) {
                const row = rawData[i];
                if (row && row.some((cell: any) => typeof cell === 'string' && (cell.includes("MSDL") || cell.includes("Số HĐ")))) {
                    headerRowIndex = i;
                    break;
                }
            }

            if (headerRowIndex === -1) {
                alert("Không tìm thấy hàng tiêu đề hợp lệ!");
                return;
            }

            const headers = rawData[headerRowIndex];

            const parsedData: PendingRow[] = [];

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
                const agentName = getCol(['Tên ĐL', 'Tên đại lý']) || "";
                const contractNumber = getCol(['Số HĐ']) || "";
                const submissionDate = getCol(['Ngày nộp']) || "";
                const pendingReason = getCol(['Lý do chờ cấp']) || "";
                const latestAppraisalRequest = getCol(['Yêu cầu thẫm định', 'Yêu cầu thẩm định']) || "";

                if (msdl || contractNumber) {
                    parsedData.push({
                        stt,
                        msdl,
                        agentName,
                        contractNumber,
                        submissionDate,
                        pendingReason,
                        latestAppraisalRequest
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
                        type: 'pending',
                        content: parsedData
                    })
                });
            } catch (err) {
                console.error("Failed to save pending data", err);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleDownloadImage = async () => {
        if (!tableRef.current) return;

        try {
            const node = tableRef.current;
            // Enforce desktop width (at least 1200px) for consistent layout
            const targetWidth = 1200;
            const targetHeight = node.scrollHeight;

            const dataUrl = await toPng(node, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                pixelRatio: 2,
                width: targetWidth,
                height: targetHeight,
                style: {
                    overflow: 'visible',
                    maxHeight: 'none',
                    maxWidth: 'none',
                    width: `${targetWidth}px`,
                    minWidth: `${targetWidth}px`,
                }
            });
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = "Danh_sach_hop_dong_cho_cap.png";
            link.click();
        } catch (error) {
            console.error("Error generating image:", error);
            alert("Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại.");
        }
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
                        Upload File Pending
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
                        className="flex gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        <ImageIcon className="w-4 h-4" />
                        Tải ảnh bảng
                    </Button>
                )}
            </div>

            <div ref={tableRef} className="rounded-md border bg-white shadow-sm overflow-visible p-6">
                <h2 className="text-xl font-bold text-center mb-6 uppercase text-orange-700 tracking-wide">
                    Danh sách hợp đồng chờ cấp
                </h2>

                <div className="border border-orange-200 rounded-md overflow-visible">
                    {/* Using direct table structure to avoid overflow-auto from shadcn Table component */}
                    <div className="w-full overflow-visible">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="bg-orange-600 hover:bg-orange-600">
                                <tr className="hover:bg-orange-600 border-b-orange-200 h-[60px]">
                                    <th className="w-[50px] font-bold text-center border-r border-orange-500 text-white align-middle">STT</th>
                                    <th className="font-bold border-r border-orange-500 w-[100px] text-white align-middle">Mã số</th>
                                    <th className="font-bold border-r border-orange-500 w-[180px] text-white align-middle">Tên đại lý</th>
                                    <th className="font-bold border-r border-orange-500 w-[120px] text-white align-middle">Số HĐ</th>
                                    <th className="font-bold border-r border-orange-500 w-[100px] text-white align-middle">Ngày nộp</th>
                                    <th className="font-bold border-r border-orange-500 w-[200px] text-white align-middle">Lý do chờ cấp</th>
                                    <th className="font-bold text-white align-middle">Yêu cầu thẩm định gần nhất</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? (
                                    data.map((row, index) => (
                                        <tr key={index} className="even:bg-orange-50 hover:bg-orange-100 border-b border-orange-100">
                                            <td className="text-center border-r border-orange-100 align-top py-3">{row.stt}</td>
                                            <td className="border-r border-orange-100 align-top py-3">{row.msdl}</td>
                                            <td className="font-medium border-r border-orange-100 align-top py-3">{row.agentName}</td>
                                            <td className="border-r border-orange-100 align-top py-3">{row.contractNumber}</td>
                                            <td className="border-r border-orange-100 align-top text-center py-3">{row.submissionDate}</td>
                                            <td className="border-r border-orange-100 align-top whitespace-pre-wrap py-3">{row.pendingReason}</td>
                                            <td className="align-top whitespace-pre-wrap py-3">{row.latestAppraisalRequest}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="h-32 text-center text-gray-500">
                                            Vui lòng upload file để xem dữ liệu
                                        </td>
                                    </tr>
                                )}
                            </tbody>
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
