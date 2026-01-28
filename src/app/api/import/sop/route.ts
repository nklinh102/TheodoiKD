import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const mode = formData.get("mode") as string; // 'update' | 'replace'
        const uploadDateStr = formData.get("uploadDate") as string; // Ngày dữ liệu đại diện (YYYY-MM-DD)

        if (!file) {
            return NextResponse.json({ error: "Không có file được tải lên" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer);
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];

        // Đọc dữ liệu dưới dạng mảng để tìm dòng header
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (!rawData || rawData.length === 0) {
            return NextResponse.json({ error: "Không tìm thấy dữ liệu trong file" }, { status: 400 });
        }

        // Tìm dòng header (dòng chứa các cột quan trọng)
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(20, rawData.length); i++) {
            const row = rawData[i];
            if (row && row.some((cell: any) =>
                typeof cell === 'string' && (
                    cell.trim().toLowerCase().includes('msdl') ||
                    cell.trim().toLowerCase().includes('agent code') ||
                    cell.trim().toLowerCase().includes('mã đl')
                )
            )) {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex === -1) {
            headerRowIndex = 0; // Fallback về dòng đầu tiên
        }

        // Parse dữ liệu từ dòng header
        const data: any[] = XLSX.utils.sheet_to_json(sheet, {
            range: headerRowIndex,
            defval: ""
        });

        // Chuẩn hóa key
        const normalizeKey = (key: string) => key.toLowerCase().trim();

        // Helper function để parse Excel date
        const parseExcelDate = (val: any): string | null => {
            if (!val) return null;

            // Nếu là số (Excel date serial number)
            if (typeof val === 'number') {
                // Excel date: số ngày kể từ 1/1/1900
                const date = new Date(Math.round((val - 25569) * 86400 * 1000));
                return date.toISOString().split('T')[0];
            }

            // Nếu là string, thử parse
            if (typeof val === 'string') {
                const dateStr = val.trim();
                // Format DD/MM/YYYY
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2];
                    return `${year}-${month}-${day}`;
                }
            }

            return null;
        };

        // Xác định upload_date từ cột đầu tiên của file
        let uploadDate: string | null = null;

        if (uploadDateStr) {
            // Nếu user nhập ngày thủ công
            uploadDate = uploadDateStr;
        } else if (data.length > 0) {
            // Lấy từ cột đầu tiên "Ngày chốt dữ liệu"
            const firstRow = data[0];
            const firstRowNormalized: Record<string, any> = {};
            Object.keys(firstRow).forEach(k => {
                firstRowNormalized[normalizeKey(k)] = firstRow[k];
            });

            // Tìm cột ngày chốt dữ liệu
            const dateValue = firstRowNormalized[normalizeKey("Ngày chốt dữ liệu")]
                || firstRowNormalized[normalizeKey("Ngày chốt")]
                || firstRowNormalized[normalizeKey("Date")]
                || Object.values(firstRow)[0]; // Fallback: lấy cột đầu tiên

            uploadDate = parseExcelDate(dateValue);
        }

        // Nếu vẫn không có, dùng ngày hiện tại
        if (!uploadDate) {
            uploadDate = new Date().toISOString().split('T')[0];
        }

        // Chuyển đổi dữ liệu
        const sopRecords = data.map((row: any) => {
            const nRow: Record<string, any> = {};
            Object.keys(row).forEach(k => {
                nRow[normalizeKey(k)] = row[k];
            });

            // Tìm agent_code từ các cột có thể có
            const getValue = (...keys: string[]) => {
                for (const k of keys) {
                    const val = nRow[normalizeKey(k)];
                    if (val !== undefined && val !== null && val !== "") {
                        return typeof val === 'string' ? val.trim() : val.toString().trim();
                    }
                }
                return null;
            };

            const agentCode = getValue("MSDL", "Agent Code", "Mã ĐL", "Mã đại lý");

            if (!agentCode) return null; // Bỏ qua nếu không có mã đại lý

            // Lưu toàn bộ dữ liệu dưới dạng JSONB
            const record = {
                agent_code: agentCode,
                data: row, // Lưu toàn bộ dòng dữ liệu
                upload_date: uploadDate
            };

            return record;
        }).filter(r => r !== null);

        // Loại bỏ trùng lặp theo agent_code (giữ bản ghi cuối cùng)
        const uniqueRecords = Array.from(
            sopRecords.reduce((map, record) => {
                map.set(record.agent_code, record);
                return map;
            }, new Map()).values()
        );

        if (mode === 'replace') {
            // Xóa tất cả dữ liệu cũ
            const { error: deleteError } = await supabase
                .from("sop_data")
                .delete()
                .neq("agent_code", "______"); // Xóa tất cả

            if (deleteError) {
                console.error("Lỗi xóa dữ liệu:", deleteError);
                throw deleteError;
            }
        }

        // Upsert dữ liệu (update nếu trùng agent_code + upload_date, insert nếu mới)
        const { error } = await supabase
            .from("sop_data")
            .upsert(uniqueRecords, {
                onConflict: "agent_code,upload_date",
                ignoreDuplicates: false
            });

        if (error) {
            console.error("Lỗi Supabase:", error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            count: uniqueRecords.length,
            uploadDate: uploadDate
        });

    } catch (error: any) {
        console.error("Lỗi import SOP:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
