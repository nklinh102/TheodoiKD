"use client";

import { useEffect, useState, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Loader2, Trophy, Star, Award, TrendingUp, UserCheck, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuarterlyAgent {
    agent_code: string;
    full_name: string;
    rank: string;
    working_months: number;
    mba_pro: string;
    fyc_t: number;
    fyc_t1: number;
    fyc_t2: number;
    total_fyc: number;
    is_excellence: boolean;
    level: number;
    bonus_rate: number;
    estimated_bonus: number;
    remaining_to_next: number;
}

export function QuarterlyProductivityTable() {
    const [data, setData] = useState<QuarterlyAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState<any>({});
    const [pageSize, setPageSize] = useState("10");
    const captureRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/memo/quarterly?t=${new Date().getTime()}`);
            const result = await res.json();
            if (result.success) {
                setData(result.data);
                setMeta(result.meta);
            }
        } catch (error) {
            console.error("Lỗi lấy dữ liệu Năng suất Quý:", error);
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
            const { toPng } = await import('html-to-image');
            const element = captureRef.current;
            element.setAttribute('data-capturing', 'true');

            const originalStyle = element.style.cssText;
            const targetWidth = 1400;
            element.style.width = `${targetWidth}px`;
            element.style.minWidth = `${targetWidth}px`;
            element.style.maxWidth = `${targetWidth}px`;

            await new Promise(resolve => setTimeout(resolve, 600));
            const targetHeight = element.getBoundingClientRect().height;

            const dataUrl = await toPng(element, {
                cacheBust: true,
                backgroundColor: '#f8fafc',
                pixelRatio: 2,
                width: targetWidth,
                height: targetHeight,
                style: {
                    borderRadius: '32px',
                    width: `${targetWidth}px`,
                    minWidth: `${targetWidth}px`,
                    margin: '0',
                    padding: '0'
                }
            });

            element.style.cssText = originalStyle;
            element.removeAttribute('data-capturing');

            const link = document.createElement('a');
            link.download = `Theo_doi_Nang_suat_Quy_${meta.uploadDate || 'Update'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Lỗi tải ảnh:', error);
            captureRef.current?.removeAttribute('data-capturing');
        }
    };

    const getPaginatedData = () => {
        if (pageSize === "all") return data;
        return data.slice(0, parseInt(pageSize));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-blue-500 font-bold animate-pulse text-lg tracking-widest uppercase">Đang phân tích năng suất quý...</p>
            </div>
        );
    }

    const currentData = getPaginatedData();

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-lg">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-600 px-2 uppercase tracking-tight">Hiển thị:</span>
                    <Select value={pageSize} onValueChange={setPageSize}>
                        <SelectTrigger className="w-24 border-slate-200 focus:ring-blue-500 focus:border-blue-500 rounded-xl font-bold">
                            <SelectValue placeholder="Số lượng" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="all">Tất cả</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    onClick={handleDownloadImage}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 border-none px-8 rounded-full font-black uppercase tracking-widest text-xs h-12 group transition-all transform hover:scale-105"
                >
                    <Camera className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                    Tải ảnh danh sách
                </Button>
            </div>

            {/* Main Table Area */}
            <div ref={captureRef} className="bg-slate-50 border-4 border-white rounded-[32px] overflow-hidden shadow-2xl relative p-8 productivity-theme">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none z-0 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -ml-32 mb-0"></div>

                {/* Header Section */}
                <div className="relative z-10 text-center space-y-2 mb-6">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-800 uppercase tracking-tighter drop-shadow-sm">
                        THEO DÕI NĂNG SUẤT QUÝ
                    </h2>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-0.5 w-16 bg-gradient-to-r from-transparent to-blue-400"></div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm italic">
                            Dự tính mức thưởng năng suất quý theo bảng biểu Manulife
                        </p>
                        <div className="h-0.5 w-16 bg-gradient-to-l from-transparent to-blue-400"></div>
                    </div>
                </div>

                {/* Agents Table */}
                <div className="relative z-10 overflow-x-auto bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl mb-10">
                    <Table className="border-separate border-spacing-0">
                        <TableHeader>
                            <TableRow className="border-none">
                                <TableHead className="w-16 text-center bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest border-r border-slate-700 py-5 first:rounded-tl-3xl">STT</TableHead>
                                <TableHead className="bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest py-5 border-r border-slate-700 min-w-[200px]">Đại lý</TableHead>
                                <TableHead className="bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest py-5 border-r border-slate-700">Mã số</TableHead>
                                <TableHead className="bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest py-5 border-r border-slate-700">Rank</TableHead>

                                <TableHead className="text-right bg-blue-700 text-white font-bold text-[9px] uppercase tracking-widest border-r border-blue-800/50 min-w-[100px]">FYC T</TableHead>
                                <TableHead className="text-right bg-blue-700 text-white font-bold text-[9px] uppercase tracking-widest border-r border-blue-800/50 min-w-[100px]">FYC T-1</TableHead>
                                <TableHead className="text-right bg-blue-700 text-white font-bold text-[9px] uppercase tracking-widest border-r border-blue-800/50 min-w-[100px]">FYC T-2</TableHead>

                                <TableHead className="text-right bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest border-r border-indigo-800/50 min-w-[120px]">Tổng FYC Quý</TableHead>
                                <TableHead className="text-center bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest border-r border-slate-700">% Mức thưởng</TableHead>
                                <TableHead className="text-right bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest border-r border-rose-800/50 min-w-[120px]">Thiếu Mức Tiếp</TableHead>
                                <TableHead className="text-right bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest last:rounded-tr-3xl min-w-[140px]">Dự tính Thưởng</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center py-20 text-slate-400 italic">
                                        Không tìm thấy dữ liệu đại lý có năng suất.
                                    </TableCell>
                                </TableRow>
                            ) : currentData.map((agent, index) => (
                                <TableRow key={agent.agent_code} className="bg-white hover:bg-blue-50/30 transition-all group/row">
                                    <TableCell className="text-center font-mono text-xs text-slate-400 border-r border-b border-slate-100 py-3 group-last/row:first:rounded-bl-3xl">{index + 1}</TableCell>
                                    <TableCell className="border-r border-b border-slate-100 py-3">
                                        <div className="flex flex-col">
                                            <div className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2">
                                                {agent.full_name}
                                                {agent.is_excellence && (
                                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                )}
                                            </div>
                                            {agent.is_excellence && (
                                                <div className="mt-0.5" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500 border-r border-b border-slate-100 py-3">{agent.agent_code}</TableCell>
                                    <TableCell className="text-center border-r border-b border-slate-100 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-50 text-[10px] font-bold text-slate-500 border border-slate-200 uppercase">
                                            {agent.rank}
                                        </span>
                                    </TableCell>

                                    <TableCell className="text-right font-mono text-xs text-slate-600 border-r border-b border-slate-100 py-3 px-3">
                                        {agent.fyc_t > 0 ? formatCurrency(agent.fyc_t) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs text-slate-600 border-r border-b border-slate-100 py-3 px-3">
                                        {agent.fyc_t1 > 0 ? formatCurrency(agent.fyc_t1) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs text-slate-600 border-r border-b border-slate-100 py-3 px-3">
                                        {agent.fyc_t2 > 0 ? formatCurrency(agent.fyc_t2) : "-"}
                                    </TableCell>

                                    <TableCell className="text-right border-r border-b border-slate-100 py-3 px-3 bg-indigo-50/30">
                                        <div className="font-black tabular-nums text-sm text-indigo-700">
                                            {formatCurrency(agent.total_fyc)}
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-center border-r border-b border-slate-100 py-3">
                                        <div className={cn(
                                            "font-black tabular-nums text-xs",
                                            agent.bonus_rate > 0 ? "text-slate-800 font-black" : "text-slate-300"
                                        )}>
                                            {agent.bonus_rate > 0 ? `${(agent.bonus_rate * 100).toFixed(0)}%` : "-"}
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right border-r border-b border-slate-100 py-3 px-3 bg-rose-50/30">
                                        <div className={cn(
                                            "font-black tabular-nums text-xs",
                                            agent.remaining_to_next > 0 ? "text-rose-600" : "text-slate-300"
                                        )}>
                                            {agent.remaining_to_next > 0 ? formatCurrency(agent.remaining_to_next) : "-"}
                                        </div>
                                    </TableCell>

                                    <TableCell className="text-right border-b border-slate-100 py-3 px-4 bg-emerald-50/30 group-last/row:last:rounded-br-3xl">
                                        <div className={cn(
                                            "font-black tabular-nums text-sm",
                                            agent.estimated_bonus > 0 ? "text-emerald-700" : "text-slate-300"
                                        )}>
                                            {agent.estimated_bonus > 0 ? formatCurrency(agent.estimated_bonus) : "---"}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer / Requirements Section */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch mt-4">
                    {/* Formula Info */}
                    <div className="bg-white border border-slate-200 p-4 rounded-[32px] shadow-sm flex flex-col justify-center gap-3">
                        <div className="flex items-center gap-3 text-slate-800 font-extrabold uppercase text-sm tracking-wider">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Calculator className="w-4 h-4 text-blue-600" />
                            </div>
                            Công thức tính thưởng
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full -mr-8 -mt-8"></div>
                            <code className="text-xs font-bold text-slate-600 block leading-loose relative z-10">
                                <span className="text-blue-600 font-black">Thưởng</span> = [FYC Quý] x [% Tỷ lệ mức đạt]<br />
                                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded ml-[-8px] inline-block mt-1 italic">[FYC Quý] = Tổng FYC (T + T-1 + T-2)</span>
                            </code>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                (*) Mức 1 (15M) chỉ áp dụng cho ĐL làm việc dưới 6 tháng đầu tiên.
                            </p>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                (**) Đại lý đạt danh hiệu Manulife Pro Vàng hoặc Bạch Kim tại tháng xét thưởng.
                            </p>
                        </div>
                    </div>

                    {/* Bonus Table Overview */}
                    <div className="bg-gradient-to-br from-indigo-800 to-blue-900 p-4 rounded-[32px] shadow-2xl text-white flex flex-col gap-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <Trophy className="w-4 h-4 text-yellow-400" />
                                </div>
                                <span className="text-sm font-black uppercase tracking-[0.1em]">Bảng Mức Thưởng Chi Tiết</span>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/10 text-[9px] font-black uppercase tracking-wider text-center">
                                        <th className="p-2 px-3 border-r border-white/10" rowSpan={2}>Mức</th>
                                        <th className="p-2 px-3 border-r border-white/10" rowSpan={2}>FYC Quý</th>
                                        <th className="p-1 border-b border-white/10" colSpan={2}>% Thưởng Năng Suất</th>
                                    </tr>
                                    <tr className="bg-white/10 text-[7px] font-black uppercase tracking-wider text-center">
                                        <th className="p-1 border-r border-white/10">Đại lý</th>
                                        <th className="p-1">Xuất sắc (**)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[10px] font-bold">
                                    {[
                                        { l: '7', fyc: '120 triệu', r: '10%', e: '20%' },
                                        { l: '6', fyc: '100 triệu', r: '8%', e: '16%' },
                                        { l: '5', fyc: '80 triệu', r: '6%', e: '12%' },
                                        { l: '4', fyc: '60 triệu', r: '5%', e: '10%' },
                                        { l: '3', fyc: '45 triệu', r: '4%', e: '8%' },
                                        { l: '2', fyc: '30 triệu', r: '3%', e: '6%' },
                                        { l: '1 (*)', fyc: '15 triệu', r: '2%', e: '4%' },
                                    ].map((row, i) => (
                                        <tr key={i} className="border-t border-white/10 hover:bg-white/10 transition-colors">
                                            <td className="p-0.5 px-2 text-center border-r border-white/10 bg-white/5 text-blue-200">{row.l}</td>
                                            <td className="p-0.5 px-2 border-r border-white/10 tabular-nums">{row.fyc}</td>
                                            <td className="p-0.5 text-center border-r border-white/10 text-blue-300">{row.r}</td>
                                            <td className="p-0.5 text-center text-amber-400 font-black">{row.e}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
