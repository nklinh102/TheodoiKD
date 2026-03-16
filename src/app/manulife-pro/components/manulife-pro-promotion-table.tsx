"use client";

import { useEffect, useState, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Star, TrendingUp, Trophy, Award, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { ManulifeProGoldTable } from "./manulife-pro-gold-table";
import { ManulifeProPlatinumTable } from "./manulife-pro-platinum-table";

export interface PromotionAgent {
    stt: number;
    full_name: string;
    agent_code: string;
    working_months: number;
    fyp_3m: number;
    cc_3m: number;
    active_months_3m: number;
    fyp_12m: number;
    cc_12m: number;
    active_months_12m: number;
    k2: number;
    is_qualified_silver: boolean;
    is_qualified_gold: boolean;
    is_qualified_platinum: boolean;
    rank: string;
    group: string;
    note?: string;
}

export function ManulifeProPromotionTable() {
    const [data, setData] = useState<PromotionAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState<any>({});
    const [selectedRank, setSelectedRank] = useState<"Silver" | "Gold" | "Platinum">("Silver");
    const captureRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/manulife-pro/promotion");
            const result = await res.json();
            if (result.success) {
                setData(result.data);
                setMeta(result.meta);
            }
        } catch (error) {
            console.error("Lỗi lấy dữ liệu thăng hạng Pro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
    };

    const handleDownloadImage = async () => {
        if (!captureRef.current) return;
        try {
            const element = captureRef.current;
            element.setAttribute('data-capturing', 'true');
            const originalStyle = element.style.cssText;
            const targetWidth = 1200;
            element.style.width = `${targetWidth}px`;
            element.style.minWidth = `${targetWidth}px`;
            element.style.maxWidth = `${targetWidth}px`;

            await new Promise(resolve => setTimeout(resolve, 500));
            const { toPng } = await import('html-to-image');
            const targetHeight = element.getBoundingClientRect().height;

            const dataUrl = await toPng(element, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                pixelRatio: 2,
                width: targetWidth,
                height: targetHeight,
                style: {
                    borderRadius: '0',
                    width: `${targetWidth}px`,
                    minWidth: `${targetWidth}px`,
                }
            });

            element.style.cssText = originalStyle;
            element.removeAttribute('data-capturing');

            const link = document.createElement('a');
            link.download = `Thang_Hang_Manulife_Pro_${selectedRank}_${meta.sopMonth || 'Update'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Lỗi tải ảnh:', error);
            if (captureRef.current) {
                captureRef.current.removeAttribute('data-capturing');
            }
        }
    };

    const getRankColor = () => {
        switch (selectedRank) {
            case "Platinum": return "text-emerald-600 bg-emerald-50 border-emerald-200";
            case "Gold": return "text-yellow-600 bg-yellow-50 border-yellow-200";
            case "Silver": return "text-slate-600 bg-slate-50 border-slate-200";
            default: return "text-emerald-600 bg-emerald-50 border-emerald-200";
        }
    };

    const getBannerGradient = () => {
        switch (selectedRank) {
            case "Platinum": return "from-emerald-400 via-teal-500 to-emerald-600 shadow-emerald-200/50";
            case "Gold": return "from-yellow-400 via-amber-500 to-yellow-600 shadow-yellow-200/50";
            case "Silver": return "from-slate-400 via-slate-500 to-slate-600 shadow-slate-200/50";
        }
    }

    const filteredData = data.filter(agent => {
        const group = (agent.group || "").toUpperCase();

        // 1. Silver Tab: Show agents NOT in Manulife Pro
        // Exclude SA ranks (SA, SA (hold), etc.) as they are already past Silver tracking
        if (selectedRank === "Silver") {
            const rank = (agent.rank || "").toUpperCase();
            const isSARank = rank.startsWith("SA") || rank.includes("SA (HOLD)");
            return !group.includes("MANULIFE PRO") && !isSARank;
        }

        // 2. Gold Tab: Show agents who are currently "Manulife Pro Bạc"
        // Note: "BẠCH KIM" contains "BẠC", so we must exclude Platinum
        if (selectedRank === "Gold") {
            return group.includes("MANULIFE PRO BẠC") && !group.includes("BẠCH KIM");
        }

        // 3. Platinum Tab: Show agents who are currently "Manulife Pro Vàng"
        if (selectedRank === "Platinum") {
            return group.includes("MANULIFE PRO VÀNG");
        }

        return false;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                <p className="text-emerald-400 font-medium animate-pulse">Đang tải danh sách thăng hạng...</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header with Selection Buttons & Download */}
            <div className="flex flex-wrap justify-between items-center gap-2 bg-white p-2 px-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap gap-1.5">
                    <Button
                        onClick={() => setSelectedRank("Silver")}
                        variant="ghost"
                        className={`h-11 px-4 rounded-xl transition-all border flex gap-2.5 ${selectedRank === "Silver"
                            ? "bg-slate-600 text-white border-slate-600 shadow-md"
                            : "bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                            }`}
                    >
                        <Star className={`w-4 h-4 ${selectedRank === "Silver" ? "text-white" : "text-slate-400"}`} />
                        <div className="text-left">
                            <div className="text-[8px] font-black uppercase tracking-widest leading-none mb-0.5 opacity-70">Thăng hạng</div>
                            <div className="text-[11px] font-black uppercase">Manulife Pro Bạc</div>
                        </div>
                    </Button>

                    <Button
                        onClick={() => setSelectedRank("Gold")}
                        variant="ghost"
                        className={`h-11 px-4 rounded-xl transition-all border flex gap-2.5 ${selectedRank === "Gold"
                            ? "bg-yellow-500 text-white border-yellow-500 shadow-md"
                            : "bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:bg-yellow-50"
                            }`}
                    >
                        <Trophy className={`w-4 h-4 ${selectedRank === "Gold" ? "text-white" : "text-yellow-400"}`} />
                        <div className="text-left">
                            <div className="text-[8px] font-black uppercase tracking-widest leading-none mb-0.5 opacity-70">Thăng hạng</div>
                            <div className="text-[11px] font-black uppercase">Manulife Pro Vàng</div>
                        </div>
                    </Button>

                    <Button
                        onClick={() => setSelectedRank("Platinum")}
                        variant="ghost"
                        className={`h-11 px-4 rounded-xl transition-all border flex gap-2.5 ${selectedRank === "Platinum"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                            : "bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:bg-emerald-50"
                            }`}
                    >
                        <Award className={`w-4 h-4 ${selectedRank === "Platinum" ? "text-white" : "text-emerald-400"}`} />
                        <div className="text-left">
                            <div className="text-[8px] font-black uppercase tracking-widest leading-none mb-0.5 opacity-70">Thăng hạng</div>
                            <div className="text-[11px] font-black uppercase">Manulife Pro Bạch Kim</div>
                        </div>
                    </Button>
                </div>

                <Button
                    onClick={handleDownloadImage}
                    className="bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-200 border-none px-6 rounded-full font-bold uppercase tracking-widest text-xs h-10"
                >
                    <Camera className="w-4 h-4 mr-2" />
                    Tải ảnh danh sách
                </Button>
            </div>


            <div ref={captureRef} className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative p-4 md:p-6 manulife-pro-table">
                {/* Decorative Elements */}
                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${getBannerGradient()}`}></div>

                {/* Render Content Based on Rank */}
                {selectedRank === "Gold" ? (
                    <div className="animate-in fade-in duration-500">
                        <ManulifeProGoldTable data={filteredData} uploadDate={meta.uploadDate} />
                    </div>
                ) : selectedRank === "Platinum" ? (
                    <div className="animate-in fade-in duration-500">
                        <ManulifeProPlatinumTable data={filteredData} uploadDate={meta.uploadDate} />
                    </div>
                ) : (
                    /* Default View (Silver / Other) - Keep existing logic for Silver */
                    <>
                        {/* Visual Header for Capture */}
                        <div className="bg-white p-3 px-5 border-b border-slate-100 relative overflow-hidden flex justify-between items-center mb-4">
                            <h2 className={`text-2xl font-black uppercase tracking-tight ${selectedRank === 'Silver' ? 'text-slate-800' : selectedRank === 'Gold' ? 'text-yellow-600' : 'text-emerald-600'}`}>
                                DANH SÁCH THEO DÕI MANULIFE PRO {selectedRank === "Silver" ? "BẠC" : selectedRank === "Gold" ? "VÀNG" : "BẠCH KIM"}
                            </h2>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/50 px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                                Cập nhật hết ngày: {meta.uploadDate ? (() => {
                                    const d = new Date(meta.uploadDate);
                                    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                                })() : ''}
                            </div>
                        </div>

                        <div className="text-sm font-bold text-slate-500 mb-4 px-2">
                            Tổng số ứng viên: {filteredData.length}
                        </div>

                        <div className="overflow-x-auto bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                            <Table className="border-separate border-spacing-0">
                                <TableHeader>
                                    <TableRow className="border-none">
                                        <TableHead rowSpan={2} className="w-16 text-center bg-blue-900 text-white font-black uppercase text-[10px] tracking-widest border-r border-blue-800/50 first:rounded-tl-xl">STT</TableHead>
                                        <TableHead rowSpan={2} className="bg-blue-900 text-white font-black uppercase text-[10px] tracking-widest py-4 border-r border-blue-800/50">Đại lý</TableHead>
                                        <TableHead rowSpan={2} className="bg-blue-900 text-white font-black uppercase text-[10px] tracking-widest border-r border-blue-800/50">Mã số</TableHead>
                                        <TableHead rowSpan={2} className="text-center bg-blue-900 text-white font-black uppercase text-[10px] tracking-widest border-r border-blue-800/50">Tháng LV</TableHead>

                                        {/* Group 3 Months */}
                                        <TableHead colSpan={3} className="text-center bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest border-b border-emerald-500/50">
                                            KẾT QUẢ 3 THÁNG
                                        </TableHead>

                                        {/* Group 12 Months */}
                                        <TableHead colSpan={3} className="text-center bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest border-b border-blue-500/50">
                                            KẾT QUẢ 12 THÁNG
                                        </TableHead>

                                        <TableHead rowSpan={2} className="text-center bg-blue-900 text-white font-black uppercase text-[10px] tracking-widest border-l border-blue-800/50 border-r border-blue-800/50">Tỷ lệ duy trì</TableHead>
                                        <TableHead rowSpan={2} className="text-center bg-blue-900 text-white font-black uppercase text-[10px] tracking-widest last:rounded-tr-xl">Ghi chú</TableHead>
                                    </TableRow>
                                    <TableRow className="border-none">
                                        {/* 3 Months Columns */}
                                        <TableHead className="text-right bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wider h-10 border-r border-emerald-600/50">FYP<br />(nghìn VNĐ)</TableHead>
                                        <TableHead className="text-right bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wider h-10 border-r border-emerald-600/50">Hợp đồng</TableHead>
                                        <TableHead className="text-center bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wider h-10 border-r border-slate-200">Tháng HĐ</TableHead>

                                        {/* 12 Months Columns */}
                                        <TableHead className="text-right bg-blue-700 text-white font-bold text-[9px] uppercase tracking-wider h-10 border-r border-blue-600/50">FYP<br />(nghìn VNĐ)</TableHead>
                                        <TableHead className="text-right bg-blue-700 text-white font-bold text-[9px] uppercase tracking-wider h-10 border-r border-blue-600/50">Hợp đồng</TableHead>
                                        <TableHead className="text-center bg-blue-700 text-white font-bold text-[9px] uppercase tracking-wider h-10">Tháng HĐ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="bg-transparent">
                                    {filteredData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={12} className="text-center py-20 text-slate-400 italic">
                                                Không tìm thấy đại lý nào thỏa mãn điều kiện.
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredData.map((agent, index) => (
                                        <TableRow key={agent.agent_code} className="bg-white hover:bg-slate-50/50 transition-all group group/row">
                                            <TableCell className="text-center font-mono text-xs text-slate-400 border-r border-b border-slate-100 py-1.5 group-last/row:first:rounded-bl-xl">{index + 1}</TableCell>
                                            <TableCell className="border-r border-b border-slate-100 py-1.5">
                                                <div className="font-bold text-slate-900 text-sm">{agent.full_name}</div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-slate-500 border-r border-b border-slate-100 py-1.5">{agent.agent_code}</TableCell>
                                            <TableCell className="text-center border-r border-b border-slate-100 py-1.5">
                                                <div className="inline-flex items-center px-2 py-0.5 rounded bg-white border border-slate-200 text-xs font-bold text-slate-600">
                                                    {agent.working_months}
                                                </div>
                                            </TableCell>

                                            {/* 3 Months Data */}
                                            <TableCell className="text-right border-r border-b border-slate-100 bg-slate-50/10 py-1.5 px-2 align-top">
                                                <div className="font-bold tabular-nums text-sm text-slate-900 mb-0.5">
                                                    {formatCurrency(agent.fyp_3m)}
                                                </div>
                                                <div className="w-full space-y-1">
                                                    <div className="h-1 w-full bg-rose-100 rounded-full overflow-hidden flex shadow-inner">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${Math.min((agent.fyp_3m / 40000) * 100, 100)}%` }}></div>
                                                    </div>
                                                    {agent.fyp_3m < 40000 && (
                                                        <div className="text-[9px] font-medium text-slate-500 tracking-tight">
                                                            -{formatCurrency(40000 - agent.fyp_3m)}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right border-r border-b border-slate-100 bg-slate-50/10 py-1.5 px-2 align-top">
                                                <div className="font-bold tabular-nums text-sm text-slate-900 mb-0.5">
                                                    {agent.cc_3m}
                                                </div>
                                                <div className="w-full space-y-1">
                                                    <div className="h-1 w-full bg-rose-100 rounded-full overflow-hidden flex shadow-inner">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${Math.min((agent.cc_3m / 3) * 100, 100)}%` }}></div>
                                                    </div>
                                                    {agent.cc_3m < 3 && (
                                                        <div className="text-[9px] font-medium text-slate-500 tracking-tight text-right">
                                                            -{3 - agent.cc_3m} CC
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center border-r border-b border-slate-100 bg-slate-50/10 py-1.5 px-2 align-top">
                                                <div className="font-bold tabular-nums text-sm text-slate-900 mb-0.5">
                                                    {agent.active_months_3m}
                                                </div>
                                                <div className="w-full space-y-1">
                                                    <div className="h-1 w-full bg-rose-100 rounded-full overflow-hidden flex shadow-inner">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${Math.min((agent.active_months_3m / 2) * 100, 100)}%` }}></div>
                                                    </div>
                                                    {agent.active_months_3m < 2 && (
                                                        <div className="text-[9px] font-medium text-slate-500 tracking-tight whitespace-nowrap">
                                                            -{2 - agent.active_months_3m} thg
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* 12 Months Data */}
                                            <TableCell className="text-right border-r border-b border-slate-100 bg-slate-50/10 py-1.5 px-2 align-top">
                                                <div className="font-bold tabular-nums text-sm text-slate-900 mb-0.5">
                                                    {formatCurrency(agent.fyp_12m)}
                                                </div>
                                                <div className="w-full space-y-1">
                                                    <div className="h-1 w-full bg-rose-200 rounded-full overflow-hidden flex shadow-inner">
                                                        <div className="h-full bg-blue-500" style={{ width: `${Math.min((agent.fyp_12m / 100000) * 100, 100)}%` }}></div>
                                                    </div>
                                                    {agent.fyp_12m < 100000 && (
                                                        <div className="text-[9px] font-medium text-slate-500 tracking-tight">
                                                            -{formatCurrency(100000 - agent.fyp_12m)}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right border-r border-b border-slate-100 bg-slate-50/10 py-1.5 px-2 align-top">
                                                <div className="font-bold tabular-nums text-sm text-slate-900 mb-0.5">
                                                    {agent.cc_12m}
                                                </div>
                                                <div className="w-full space-y-1">
                                                    <div className="h-1 w-full bg-rose-200 rounded-full overflow-hidden flex shadow-inner">
                                                        <div className="h-full bg-blue-500" style={{ width: `${Math.min((agent.cc_12m / 5) * 100, 100)}%` }}></div>
                                                    </div>
                                                    {agent.cc_12m < 5 && (
                                                        <div className="text-[9px] font-medium text-slate-500 tracking-tight text-right">
                                                            -{5 - agent.cc_12m} CC
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center border-r border-b border-slate-100 bg-slate-50/10 py-1.5 px-2 align-top">
                                                <div className="font-bold tabular-nums text-sm text-slate-900 mb-0.5">
                                                    {agent.active_months_12m}
                                                </div>
                                                <div className="w-full space-y-1">
                                                    <div className="h-1 w-full bg-rose-200 rounded-full overflow-hidden flex shadow-inner">
                                                        <div className="h-full bg-blue-500" style={{ width: `${Math.min((agent.active_months_12m / 3) * 100, 100)}%` }}></div>
                                                    </div>
                                                    {agent.active_months_12m < 3 && (
                                                        <div className="text-[9px] font-medium text-slate-500 tracking-tight whitespace-nowrap">
                                                            -{3 - agent.active_months_12m} thg
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* K2 & Note */}
                                            <TableCell className="text-center border-r border-b border-slate-100 py-1.5">
                                                <div className={cn(
                                                    "font-bold tabular-nums text-sm",
                                                    agent.k2 >= 70 ? "text-emerald-600" : "text-rose-500"
                                                )}>
                                                    {agent.working_months < 17 && agent.k2 === 0 ? "" : `${agent.k2}%`}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center border-b border-slate-100 py-1.5 group-last/row:last:rounded-br-xl">
                                                <div className="flex items-center justify-center min-h-[32px]">
                                                    {(() => {
                                                        const isK2Pass = agent.k2 >= 70;
                                                        const pass3m = agent.fyp_3m >= 40000 && agent.cc_3m >= 3 && agent.active_months_3m >= 2;
                                                        const pass12m = agent.fyp_12m >= 100000 && agent.cc_12m >= 5 && agent.active_months_12m >= 3;

                                                        if (isK2Pass && (pass3m || pass12m)) {
                                                            return <span className="text-emerald-600 font-extrabold text-[9px] uppercase tracking-wider">Đạt (tạm tính)</span>;
                                                        }
                                                        return <span className="text-slate-300 text-xs font-medium leading-none">---</span>;
                                                    })()}
                                                </div>
                                            </TableCell>



                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Criteria Table Section */}
                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-5 bg-slate-400 rounded-full"></div>
                                <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">Tiêu chí thăng hạng Manulife Pro Bạc</h3>
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
                                            <td rowSpan={2} className="px-4 py-4 font-medium text-slate-700 bg-slate-50/50 border-r border-slate-200 text-xs">
                                                Đại lý trên 2 tháng làm việc đầu tiên
                                            </td>
                                            <td className="px-4 py-3 text-center font-semibold text-slate-600 border-r border-slate-200">12 tháng</td>
                                            <td className="px-4 py-3 text-center font-bold text-blue-600 border-r border-slate-200">5</td>
                                            <td className="px-4 py-3 text-center font-bold text-blue-600 border-r border-slate-200">100.000</td>
                                            <td className="px-4 py-3 text-center font-bold text-blue-600 border-r border-slate-200">3</td>
                                            <td className="px-4 py-3 text-center font-medium text-slate-500 border-r border-slate-200">Có</td>
                                            <td rowSpan={2} className="px-4 py-3 text-center font-bold text-emerald-600">≥ 70%</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 text-center font-semibold text-slate-600 border-r border-slate-200">3 tháng</td>
                                            <td className="px-4 py-3 text-center font-bold text-emerald-600 border-r border-slate-200">3</td>
                                            <td className="px-4 py-3 text-center font-bold text-emerald-600 border-r border-slate-200">40.000</td>
                                            <td className="px-4 py-3 text-center font-bold text-emerald-600 border-r border-slate-200">2</td>
                                            <td className="px-4 py-3 text-center font-medium text-slate-500 border-r border-slate-200">Có</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Watermark Logo - Centered Overlay but visually below text using blend mode */}
                <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none select-none z-50 mix-blend-multiply">
                    <img
                        src={selectedRank === "Platinum" ? "/images/ProBachkim.webp" : selectedRank === "Gold" ? "/images/ProVang.webp" : "/images/ProBac.webp"}
                        alt={`${selectedRank} Watermark`}
                        className="h-[400px] w-auto object-contain"
                    />
                </div>
            </div>
        </div>
    );
}
