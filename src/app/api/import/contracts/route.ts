
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const mode = formData.get("mode") as string; // 'replace' | 'append' (default)

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer);
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];

        // Use header:1 to get raw array to find the header row
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (!rawData || rawData.length === 0) {
            return NextResponse.json({ error: "No data found" }, { status: 400 });
        }

        let headerRowIndex = -1;
        // Search for a row that contains "Số HĐ" or "Policy Number"
        for (let i = 0; i < Math.min(20, rawData.length); i++) {
            const row = rawData[i];
            if (row && row.some((cell: any) =>
                typeof cell === 'string' && (
                    cell.trim().toLowerCase() === 'số hđ' ||
                    cell.trim().toLowerCase() === 'policy number' ||
                    cell.trim().toLowerCase() === 'msdl'
                )
            )) {
                headerRowIndex = i;
                break;
            }
        }

        if (headerRowIndex === -1) {
            // Fallback to row 0 if not found, though unlikely for valid files
            headerRowIndex = 0;
        }

        // Now parse with the found header row
        // We can pass 'range' option to sheet_to_json to skip rows.
        const data: any[] = XLSX.utils.sheet_to_json(sheet, {
            range: headerRowIndex,
            defval: ""
        });

        // Normalize keys
        const normalizeKey = (key: string) => key.toLowerCase().trim();

        const contracts = data.map((row: any) => {
            const nRow: Record<string, any> = {};
            Object.keys(row).forEach(k => {
                nRow[normalizeKey(k)] = row[k];
            });

            const getValue = (...keys: string[]) => {
                for (const k of keys) {
                    const val = nRow[normalizeKey(k)];
                    if (val !== undefined && val !== null && val !== "") return val.toString().trim();
                }
                return null;
            };

            const parseDate = (val: any) => {
                if (!val) return null;
                if (typeof val === 'number') {
                    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
                    return date.toISOString().split('T')[0];
                }
                const dateStr = val.toString().trim();
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    return `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                return null; // Invalid date format
            };

            // Mapping based on: "STT","Khu vực","Ngày nộp","MSDL","Đại lý","Số HĐ","Người được bảo hiểm","Sản phẩm","Mệnh giá","Phí Bảo hiểm","APE ","Tình trạng hợp đồng","Từ chối","Cấp hợp đồng"
            const policyNumber = getValue("Số HĐ", "Policy Number");

            if (!policyNumber) return null; // Skip if no policy number

            const rawStatus = getValue("Tình trạng hợp đồng", "Status") || "";
            const issueDate = parseDate(getValue("Cấp hợp đồng", "Ngày cấp", "Issue Date"));
            const declineDate = parseDate(getValue("Từ chối", "Declined Date", "Ngày hủy"));

            // Map Status to conform to likely DB constraints (Issued, Pending, Ack, Cancelled)
            let status = "Pending";
            const s = rawStatus.toLowerCase().trim();

            if (declineDate) {
                status = "Cancelled"; // If "Từ chối" has a date, it is Cancelled/Declined
            } else if (issueDate) {
                status = "Issued"; // If there is an issue date, it's Issued
            } else if (s.includes("hủy") || s.includes("cancel") || s.includes("từ chối") || s.includes("declined")) {
                status = "Cancelled";
            } else if (s.includes("trả phí") || s.includes("active") || s.includes("hiệu lực")) {
                status = "Issued";
            } else if (s.includes("ack")) {
                status = "Ack";
            } else {
                status = "Pending";
            }

            // Determine which headers are present to avoid overwriting with null
            const hasHeader = (...keys: string[]) => keys.some(k => normalizeKey(k) in nRow);

            const record: any = {
                policy_number: policyNumber,
                // Always valid to try to derive status if we have related columns, but usually status comes from specific columns
            };

            // Only add fields if the header exists
            if (hasHeader("MSDL", "Agent Code", "Mã ĐL"))
                record.agent_code = getValue("MSDL", "Agent Code", "Mã ĐL");

            if (hasHeader("Người được bảo hiểm", "Customer Name", "Bên mua bảo hiểm"))
                record.customer_name = getValue("Người được bảo hiểm", "Customer Name", "Bên mua bảo hiểm");

            if (hasHeader("Sản phẩm", "Product"))
                record.product_code = getValue("Sản phẩm", "Product");

            if (hasHeader("Ngày nộp", "Submit Date"))
                record.submit_date = parseDate(getValue("Ngày nộp", "Submit Date"));

            // Issue Date and Decline Date are used to calculate Status, but we also want to store them if present
            if (hasHeader("Cấp hợp đồng", "Ngày cấp", "Issue Date"))
                record.issue_date = issueDate; // Already parsed above

            if (hasHeader("Phí Bảo hiểm", "FYP"))
                record.fyp = parseFloat(getValue("Phí Bảo hiểm", "FYP") || "0");

            if (hasHeader("APE", "APE "))
                record.ape = parseFloat(getValue("APE", "APE ") || "0");

            // Status logic:
            // If the file has explicit status column OR date columns that imply status, we update status.
            // If the file purely lacks status info, maybe we shouldn't touch status?
            // But usually "Update file" implies status update.
            // Let's assume if any of the status-determining columns are present, we recalculate status.
            if (hasHeader("Tình trạng hợp đồng", "Status") ||
                hasHeader("Cấp hợp đồng", "Ngày cấp", "Issue Date") ||
                hasHeader("Từ chối", "Declined Date", "Ngày hủy")) {

                let status = "Pending";
                // If we have existing data in DB, we don't know it here. 
                // So we must calculate status based on what we have in this row.
                // If this is a partial update, say only "Issue Date" is provided, we infer status is "Issued".

                // Re-use logic
                const s = rawStatus.toLowerCase().trim();

                if (declineDate) {
                    status = "Cancelled";
                } else if (issueDate) {
                    status = "Issued";
                } else if (s.includes("hủy") || s.includes("cancel") || s.includes("từ chối") || s.includes("declined")) {
                    status = "Cancelled";
                } else if (s.includes("trả phí") || s.includes("active") || s.includes("hiệu lực")) {
                    status = "Issued";
                } else if (s.includes("ack")) {
                    status = "Ack";
                } else {
                    status = "Pending";
                }
                record.status = status;
            }

            return record;
        }).filter(c => c !== null);

        // Deduplicate contracts by policy_number
        // Keep the last occurrence in the file as it's likely the updated status
        const uniqueContracts = Array.from(
            contracts.reduce((map, contract) => {
                map.set(contract.policy_number, contract);
                return map;
            }, new Map()).values()
        );

        if (mode === 'replace') {
            // Delete all existing contracts
            const { error: deleteError } = await supabase
                .from("contracts")
                .delete()
                .neq("policy_number", "______"); // Delete all rows where policy_number is not something impossible

            if (deleteError) {
                console.error("Delete error:", deleteError);
                throw deleteError;
            }
        }

        const { error } = await supabase
            .from("contracts")
            .upsert(uniqueContracts, { onConflict: "policy_number" });

        if (error) {
            console.error("Supabase error:", error);
            throw error;
        }

        return NextResponse.json({ success: true, count: contracts.length });

    } catch (error: any) {
        console.error("Import contracts error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
