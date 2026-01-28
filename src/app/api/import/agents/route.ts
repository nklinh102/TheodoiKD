import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Read file buffer
        const buffer = await file.arrayBuffer();

        // Parse using XLSX (supports csv, xls, xlsx)
        const wb = XLSX.read(buffer);
        const sheetName = wb.SheetNames[0]; // Take first sheet
        const sheet = wb.Sheets[sheetName];

        // Convert to JSON
        const data: any[] = XLSX.utils.sheet_to_json(sheet, {
            defval: "" // Default value for empty cells
        });

        if (!data || data.length === 0) {
            return NextResponse.json({ error: "No data found in file" }, { status: 400 });
        }

        // Normalize keys to lowercase and trim for easier matching
        const normalizeKey = (key: string) => key.toLowerCase().trim();

        const agents = data.map((row: any) => {
            // Create a normalized row for easier lookup
            const nRow: Record<string, any> = {};
            Object.keys(row).forEach(k => {
                nRow[normalizeKey(k)] = row[k];
            });

            // Helper to find value by possible keys
            const getValue = (...keys: string[]) => {
                for (const k of keys) {
                    const val = nRow[normalizeKey(k)];
                    if (val !== undefined && val !== null && val !== "") return val.toString().trim();
                }
                return null;
            };

            // Helper to parse date dd/mm/yyyy or Excel serial date
            const parseDate = (val: any) => {
                if (!val) return null;

                const dateStr = val.toString().trim();

                // 1. Handle Excel serial date (e.g. "44314")
                // getValue() converts everything to string, so we must check if string is numeric
                if (!isNaN(Number(dateStr)) && !dateStr.includes('/') && !dateStr.includes('-')) {
                    const num = Number(dateStr);
                    // Excel base date check (approx > 1900 year)
                    if (num > 10000) {
                        const date = new Date(Math.round((num - 25569) * 86400 * 1000));
                        return date.toISOString().split('T')[0];
                    }
                }

                // 2. Handle text formats regex-like checks handled below


                // dd/mm/yyyy or d/m/yyyy
                if (dateStr.includes('/')) {
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        const padZero = (n: string) => n.length === 1 ? '0' + n : n;
                        return `${parts[2]}-${padZero(parts[1])}-${padZero(parts[0])}`;
                    }
                }

                // yyyy-mm-dd or dd-mm-yyyy
                if (dateStr.includes('-')) {
                    const parts = dateStr.split('-');
                    if (parts.length === 3) {
                        // Check if first part is year (4 digits)
                        if (parts[0].length === 4) return dateStr; // yyyy-mm-dd
                        // Assume dd-mm-yyyy
                        const padZero = (n: string) => n.length === 1 ? '0' + n : n;
                        return `${parts[2]}-${padZero(parts[1])}-${padZero(parts[0])}`;
                    }
                    return dateStr;
                }

                return null;
            };

            const rank = getValue("Cấp bậc", "Rank", "Chức danh", "Level") || "FA";
            const inputStatus = (getValue("Trạng thái", "Status") || "").trim();

            // Status Logic
            let status = "Active";
            const r = rank.toUpperCase();
            const s = inputStatus.toUpperCase();

            // Logic:
            // FA, UM, SUM, DM, SDM, BM, AM -> Active
            // Ter -> Terminated
            // SA -> Pending

            if (r === 'TER' || r === 'TERMINATED' || s === 'TERMINATED') {
                status = 'Terminated';
            } else if (r === 'SA' || s === 'PENDING') {
                status = 'Pending';
            } else {
                status = 'Active';
            }

            // Map fields using multiple possible header names
            return {
                agent_code: getValue("MS", "Mã số", "Agent Code", "Code", "Mã ĐL"),
                // "Đại lý" is requested by user to mean Name
                full_name: getValue("Họ tên", "Tên", "Full Name", "Name", "Họ và tên", "Đại lý"),

                // "Mã số Quản lý" is requested
                manager_code: getValue("Mã quản lý", "Mã QL", "Manager Code", "Mã người quản lý", "User Code", "Mã số Quản lý"),

                // NEW: Store Manager Name explicitly
                manager_name: getValue("Quản lý", "Tên quản lý", "Manager Name", "Manager"),

                // NEW: Explicit Group Code
                group_code: getValue("Mã tổ", "Group Code", "Group", "Mã team"),

                rank: rank,
                status: status,

                // Parsing Date
                dob: parseDate(getValue("Ngày sinh", "DOB", "Birth Date", "Năm sinh")),
                join_date: parseDate(getValue("Ngày gia nhập", "Join Date", "Start Date", "Ngày vào làm", "Ngày cấp code", "Ngày bổ nhiệm", "Date of Joining", "Ngay gia nhap", "Ngay vao lam")),

                // "Số điện thoại" is requested
                phone: getValue("Điện thoại", "SĐT", "Phone", "Mobile", "Tel", "Số điện thoại"),
                email: getValue("Email", "Mail", "Thư điện tử"),
                id_card: getValue("CMND", "CCCD", "ID Card", "CMT", "Căn cước"),

                address: getValue("Địa chỉ", "Address", "Nơi ở"),
                bank_account: getValue("Số tài khoản", "STK", "Bank Account", "Account No"),
                bank_name: getValue("Ngân hàng", "Bank Name", "Bank", "Tên ngân hàng"),
                tax_code: getValue("Mã số thuế", "MST", "Tax Code"),
                office_code: getValue("Văn phòng", "Office", "Mã VP", "VP"),

                // "Mã số người tuyển dụng" is requested
                recruiter_code: getValue("Mã tuyển dụng", "Mã TD", "Recruiter Code", "Mã người tuyển dụng", "Mã giới thiệu", "Mã số người tuyển dụng"),
            };
        }).filter((a: any) => a.agent_code); // Filter out empty rows

        const mode = formData.get("mode") as string; // 'update' | 'replace'

        if (mode === 'replace') {
            // Delete all existing agents first
            const { error: deleteError } = await supabase
                .from("agents")
                .delete()
                .neq("agent_code", "______"); // Delete all

            if (deleteError) throw deleteError;
        }

        const { error } = await supabase
            .from("agents")
            .upsert(agents, { onConflict: "agent_code" });

        if (error) throw error;

        return NextResponse.json({ success: true, count: agents.length });
    } catch (error: any) {
        console.error("Agents import error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
