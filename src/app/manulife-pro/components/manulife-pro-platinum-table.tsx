import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PromotionAgent } from "./manulife-pro-promotion-table";

interface ManulifeProPlatinumTableProps {
    data: PromotionAgent[];
    uploadDate?: string;
}

export function ManulifeProPlatinumTable({ data, uploadDate }: ManulifeProPlatinumTableProps) {

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat("vi-VN").format(Math.round(val));
    };

    // Targets for Platinum
    const targets = {
        fyp: 600000,
        cc: 24,
        active: 6,
    };

    return (
        <div className="space-y-4">
            {/* Visual Header for Capture */}
            <div className="bg-white p-3 px-5 border-b border-slate-100 relative overflow-hidden flex justify-between items-center mb-4">
                <h2 className="text-2xl font-black uppercase tracking-tight text-emerald-600">
                    DANH SÁCH THEO DÕI MANULIFE PRO BẠCH KIM
                </h2>
                {uploadDate && (
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/50 px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                        Cập nhật hết ngày: {(() => {
                            const d = new Date(uploadDate);
                            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                        })()}
                    </div>
                )}
            </div>

            <div className="text-sm font-bold text-slate-500 mb-4 px-2">
                Tổng số ứng viên: {data.length}
            </div>

            {data.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    Không tìm thấy đại lý Manulife Pro Vàng nào.
                </div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <Table className="border-separate border-spacing-0">
                        <TableHeader>
                            <TableRow className="border-none">
                                <TableHead rowSpan={2} className="w-16 text-center bg-blue-900 text-white font-black uppercase text-[10px] tracking-widest border-r border-blue-800/50 first:rounded-tl-xl">STT</TableHead>
                                <TableHead rowSpan={2} className="bg-blue-900 text-white font-black uppercase text-[10px] tracking-widest py-4 border-r border-blue-800/50">Họ tên</TableHead>
                                <TableHead rowSpan={2} className="bg-blue-900 text-white font-black uppercase text-[10px] tracking-widest border-r border-blue-800/50">Mã số</TableHead>
                                <TableHead rowSpan={2} className="text-center bg-blue-900 text-white font-black uppercase text-[10px] tracking-widest border-r border-blue-800/50">Tháng LV</TableHead>

                                {/* Group Header */}
                                <TableHead colSpan={3} className="text-center bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest border-b border-emerald-500/50">
                                    Kết quả 12 tháng (Thực đạt)
                                </TableHead>

                                <TableHead rowSpan={2} className="text-center bg-blue-900 text-white font-black uppercase text-[10px] tracking-widest border-l border-blue-800/50 border-r border-blue-800/50">Tỷ lệ duy trì</TableHead>
                                <TableHead rowSpan={2} className="text-center bg-blue-900 text-white font-black uppercase text-[10px] tracking-widest last:rounded-tr-xl">Ghi chú</TableHead>
                            </TableRow>
                            <TableRow className="border-none">
                                <TableHead className="text-right bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wider h-10 border-r border-emerald-600/50">FYP<br />(nghìn VNĐ)</TableHead>
                                <TableHead className="text-right bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wider h-10 border-r border-emerald-600/50">Hợp đồng</TableHead>
                                <TableHead className="text-center bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wider h-10">Active Month</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="bg-transparent">
                            {data.map((record, index) => {
                                const workingMonths = record.working_months;

                                const fyp = record.fyp_12m || 0;
                                const cc = record.cc_12m || 0;
                                const active = record.active_months_12m || 0;
                                const k2 = record.k2 || 0;

                                const isFypPass = fyp >= targets.fyp;
                                const isCcPass = cc >= targets.cc;
                                const isActivePass = active >= targets.active;
                                const isK2Pass = k2 >= 70;

                                return (
                                    <TableRow key={record.agent_code} className="bg-white hover:bg-slate-50/50 transition-all group group/row">
                                        <TableCell className="text-center font-mono text-xs text-slate-400 border-r border-b border-slate-100 py-1.5 group-last/row:first:rounded-bl-xl">{index + 1}</TableCell>
                                        <TableCell className="border-r border-b border-slate-100 py-1.5">
                                            <div className="font-bold text-slate-900 text-sm">
                                                {record.full_name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-slate-500 border-r border-b border-slate-100 py-1.5">{record.agent_code}</TableCell>
                                        <TableCell className="text-center border-r border-b border-slate-100 py-1.5">
                                            <div className="inline-flex items-center px-2 py-0.5 rounded bg-white border border-slate-200 text-xs font-bold text-slate-600">
                                                {workingMonths}
                                            </div>
                                        </TableCell>

                                        {/* FYP */}
                                        <TableCell className="text-right border-r border-b border-slate-100 bg-slate-50/10 py-1.5 px-2 align-top">
                                            <div className="font-bold tabular-nums text-sm text-slate-900 mb-0.5">
                                                {formatNumber(fyp)}
                                            </div>
                                            <div className="w-full space-y-1">
                                                <div className="h-1 w-full bg-rose-100 rounded-full overflow-hidden flex shadow-inner">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min((fyp / targets.fyp) * 100, 100)}%` }}></div>
                                                </div>
                                                {fyp < targets.fyp && (
                                                    <div className="text-[9px] font-medium text-slate-500 tracking-tight">
                                                        -{formatNumber(targets.fyp - fyp)}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* CC */}
                                        <TableCell className="text-right border-r border-b border-slate-100 bg-slate-50/10 py-1.5 px-2 align-top">
                                            <div className="font-bold tabular-nums text-sm text-slate-900 mb-0.5">
                                                {cc}
                                            </div>
                                            <div className="w-full space-y-1">
                                                <div className="h-1 w-full bg-rose-100 rounded-full overflow-hidden flex shadow-inner">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min((cc / targets.cc) * 100, 100)}%` }}></div>
                                                </div>
                                                {cc < targets.cc && (
                                                    <div className="text-[9px] font-medium text-slate-500 tracking-tight text-right">
                                                        -{targets.cc - cc} CC
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Active Months */}
                                        <TableCell className="text-center bg-slate-50/10 py-1.5 px-2 align-top border-r border-b border-slate-100">
                                            <div className="font-bold tabular-nums text-sm text-slate-900 mb-0.5">
                                                {active}
                                            </div>
                                            <div className="w-full space-y-1">
                                                <div className="h-1 w-full bg-rose-100 rounded-full overflow-hidden flex shadow-inner">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min((active / targets.active) * 100, 100)}%` }}></div>
                                                </div>
                                                {active < targets.active && (
                                                    <div className="text-[9px] font-medium text-slate-500 tracking-tight whitespace-nowrap">
                                                        -{targets.active - active} thg
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* K2 */}
                                        <TableCell className="text-center border-r border-b border-slate-100 py-1.5">
                                            <div className={cn(
                                                "font-bold tabular-nums text-sm",
                                                isK2Pass ? "text-emerald-600" : "text-rose-500"
                                            )}>
                                                {workingMonths < 17 && k2 === 0 ? "" : `${k2}%`}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center border-b border-slate-100 py-1.5 group-last/row:last:rounded-br-xl">
                                            {isFypPass && isCcPass && isActivePass && isK2Pass ? (
                                                <span className="text-emerald-600 font-extrabold text-[10px] uppercase">Đạt (tạm tính)</span>
                                            ) : (
                                                <span className="text-slate-300 text-xs font-medium">{record.note || "---"}</span>
                                            )}
                                        </TableCell>


                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Criteria Table Section for Platinum */}
            <div className="mt-8 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-emerald-400 rounded-full"></div>
                    <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">Tiêu chí thăng hạng Manulife Pro Bạch Kim</h3>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <table className="w-full border-collapse bg-white text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 text-left font-bold text-slate-600 uppercase text-[10px] tracking-wider border-r border-slate-200">Đối tượng</th>
                                <th className="px-4 py-3 text-center font-bold text-slate-600 uppercase text-[10px] tracking-wider border-r border-slate-200">Giai đoạn</th>
                                <th className="px-4 py-3 text-center font-bold text-slate-600 uppercase text-[10px] tracking-wider border-r border-slate-200">CC</th>
                                <th className="px-4 py-3 text-center font-bold text-slate-600 uppercase text-[10px] tracking-wider border-r border-slate-200">FYP (nghìn VNĐ)</th>
                                <th className="px-4 py-3 text-center font-bold text-slate-600 uppercase text-[10px] tracking-wider border-r border-slate-200">Tháng Hoạt động</th>
                                <th className="px-4 py-3 text-center font-bold text-slate-600 uppercase text-[10px] tracking-wider border-r border-slate-200">Đào tạo</th>
                                <th className="px-4 py-3 text-center font-bold text-slate-600 uppercase text-[10px] tracking-wider">K2 (TLDTHD)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="px-4 py-4 font-medium text-slate-700 bg-slate-50/50 border-r border-slate-200 text-xs">
                                    Tất cả Đại lý
                                </td>
                                <td className="px-4 py-3 text-center font-semibold text-slate-600 border-r border-slate-200">12 tháng</td>
                                <td className="px-4 py-3 text-center font-bold text-emerald-600 border-r border-slate-200">24</td>
                                <td className="px-4 py-3 text-center font-bold text-emerald-600 border-r border-slate-200">600.000</td>
                                <td className="px-4 py-3 text-center font-bold text-emerald-600 border-r border-slate-200">6</td>
                                <td className="px-4 py-3 text-center font-medium text-slate-500 border-r border-slate-200">Không</td>
                                <td className="px-4 py-3 text-center font-bold text-emerald-600">≥ 70%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
