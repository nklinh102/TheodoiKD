"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SopRecord {
    id: string;
    agent_code: string;
    data: any;
    upload_date: string;
    created_at: string;
}

interface SopTableProps {
    refreshTrigger: number;
}

export function SopTable({ refreshTrigger }: SopTableProps) {
    const [records, setRecords] = useState<SopRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: "50",
            });

            if (searchTerm) {
                params.append("agentCode", searchTerm);
            }

            if (filterDate) {
                params.append("uploadDate", filterDate);
            }

            const res = await fetch(`/api/sop?${params.toString()}`);
            const result = await res.json();

            if (res.ok) {
                setRecords(result.data || []);
                setTotal(result.total || 0);
                setTotalPages(result.totalPages || 1);
            } else {
                console.error("Lỗi lấy dữ liệu:", result.error);
            }
        } catch (error) {
            console.error("Lỗi fetch:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, refreshTrigger]);

    const handleSearch = () => {
        setPage(1);
        fetchData();
    };

    // Lấy các cột quan trọng từ data JSONB
    const getDisplayValue = (data: any, ...keys: string[]) => {
        for (const key of keys) {
            const value = data[key];
            if (value !== undefined && value !== null && value !== "") {
                return value;
            }
        }
        return "-";
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Tìm kiếm Mã ĐL</label>
                    <Input
                        placeholder="Nhập mã đại lý..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                </div>
                <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Lọc theo ngày</label>
                    <Input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
                <Button onClick={handleSearch}>Tìm kiếm</Button>
            </div>

            <div className="text-sm text-muted-foreground">
                Tổng số: {total} bản ghi | Trang {page} / {totalPages}
            </div>

            {loading ? (
                <div className="text-center py-8">Đang tải...</div>
            ) : records.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    Chưa có dữ liệu. Vui lòng import file SOP.
                </div>
            ) : (
                <>
                    <div className="border rounded-lg overflow-auto max-h-[600px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky top-0 bg-background">Mã ĐL</TableHead>
                                    <TableHead className="sticky top-0 bg-background">Họ tên</TableHead>
                                    <TableHead className="sticky top-0 bg-background">Cấp bậc</TableHead>
                                    <TableHead className="sticky top-0 bg-background">Khu vực</TableHead>
                                    <TableHead className="sticky top-0 bg-background">Chi nhánh</TableHead>
                                    <TableHead className="sticky top-0 bg-background">Ngày dữ liệu</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">{record.agent_code}</TableCell>
                                        <TableCell>
                                            {getDisplayValue(record.data, "Họ tên", "Full Name", "Tên ĐL")}
                                        </TableCell>
                                        <TableCell>
                                            {getDisplayValue(record.data, "Cấp bậc", "Rank", "Chức danh")}
                                        </TableCell>
                                        <TableCell>
                                            {getDisplayValue(record.data, "Khu vực", "Region", "Area")}
                                        </TableCell>
                                        <TableCell>
                                            {getDisplayValue(record.data, "Chi nhánh", "Branch", "CN")}
                                        </TableCell>
                                        <TableCell>{record.upload_date || "-"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-between items-center">
                        <Button
                            variant="outline"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Trang trước
                        </Button>
                        <span className="text-sm">
                            Trang {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Trang sau
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
