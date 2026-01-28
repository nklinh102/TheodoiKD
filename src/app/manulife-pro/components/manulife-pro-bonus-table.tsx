"use client";

import { useEffect, useState, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Save, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProAgent {
    stt: number;
    agent_code: string;
    full_name: string;
    pro_type: string;
    promo_month: string;
    monthly_fyp: number;
    bonus_amount: number;
    remaining_fyp: number;
}

export function ManulifeProBonusTable() {
    const [data, setData] = useState<ProAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState<any>({});
    const [editingCode, setEditingCode] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const captureRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/manulife-pro/bonus");
            const result = await res.json();
            if (result.success) {
                setData(result.data);
                setMeta(result.meta);
            }
        } catch (error) {
            console.error("Lỗi lấy dữ liệu thưởng Pro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveMonth = async (agentCode: string) => {
        try {
            const res = await fetch("/api/manulife-pro/bonus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agent_code: agentCode, promo_month: editValue })
            });
            if (res.ok) {
                setData(prev => prev.map(a => a.agent_code === agentCode ? { ...a, promo_month: editValue } : a));
                setEditingCode(null);
            }
        } catch (error) {
            console.error("Lỗi lưu tháng thăng hạng:", error);
        }
    };

    const handleDownloadImage = async () => {
        if (!captureRef.current) return;
        try {
            // Set attribute to trigger CSS overrides (hide scrollbars, expand content)
            const element = captureRef.current;
            element.setAttribute('data-capturing', 'true');

            // Store original styles
            const originalStyle = element.style.cssText;
            const originalParentStyle = element.parentElement?.style.cssText || '';

            // Force desktop width
            const targetWidth = 1200;
            element.style.width = `${targetWidth}px`;
            element.style.minWidth = `${targetWidth}px`;
            element.style.maxWidth = `${targetWidth}px`;

            // Wait longer for layout
            await new Promise(resolve => setTimeout(resolve, 500));

            const { toPng } = await import('html-to-image');
            const targetHeight = element.scrollHeight;

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

            // Restore original styles
            element.style.cssText = originalStyle;
            if (element.parentElement) {
                element.parentElement.style.cssText = originalParentStyle;
            }
            // Cleanup attribute
            element.removeAttribute('data-capturing');

            const link = document.createElement('a');
            link.download = `Manulife_Pro_Bonus_${meta.sopMonth || 'Update'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Lỗi tải ảnh:', error);
            if (captureRef.current) {
                captureRef.current.removeAttribute('data-capturing');
            }
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
    };

    const getProBadgeColor = (type: string) => {
        if (type.includes("Bạch Kim")) return "bg-emerald-500 text-white border-none shadow-[0_0_15px_rgba(16,185,129,0.4)]";
        if (type.includes("Vàng")) return "bg-yellow-500 text-yellow-950 border-none shadow-[0_0_15px_rgba(234,179,8,0.4)]";
        return "bg-slate-300 text-slate-900 border-none shadow-[0_0_15px_rgba(203,213,225,0.4)]";
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                <p className="text-emerald-400 font-medium animate-pulse">Đang xử lý dữ liệu Manulife Pro...</p>
            </div>
        );
    }

    const displayMonthYear = meta.uploadDate ? (() => {
        const [y, m, d] = meta.uploadDate.split('-');
        return `${d}/${m}/${y}`;
    })() : "";

    const stats = {
        totalAgents: data.length,
        totalFyp: data.reduce((sum, a) => sum + (a.monthly_fyp || 0), 0),
        totalBonus: data.reduce((sum, a) => sum + (a.bonus_amount || 0), 0),
        rankCounts: {
            platinum: data.filter(a => a.pro_type.includes("Bạch Kim")).length,
            gold: data.filter(a => a.pro_type.includes("Vàng")).length,
            silver: data.filter(a => a.pro_type.includes("Bạc")).length,
        }
    };

    return (
        <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Tổng Đại lý Pro</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 leading-none">{stats.totalAgents}</span>
                        <span className="text-slate-400 text-xs font-bold">Agents</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center border-l-4 border-l-emerald-500">
                    <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-1">Tổng FYP Tháng T</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 leading-none">{formatCurrency(stats.totalFyp)}</span>
                        <span className="text-slate-400 text-xs font-bold">đ</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center border-l-4 border-l-yellow-500">
                    <span className="text-yellow-600 text-[10px] font-black uppercase tracking-widest mb-1">Tổng Thưởng Dự kiến</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 leading-none">{formatCurrency(stats.totalBonus)}</span>
                        <span className="text-slate-400 text-xs font-bold">đ</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-3 gap-2">
                    <div className="text-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mx-auto mb-1.5"></div>
                        <div className="text-xl font-black text-slate-900 leading-none">{stats.rankCounts.platinum}</div>
                        <div className="text-[8px] text-slate-400 font-black uppercase mt-1">BK</div>
                    </div>
                    <div className="text-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mx-auto mb-1.5"></div>
                        <div className="text-xl font-black text-slate-900 leading-none">{stats.rankCounts.gold}</div>
                        <div className="text-[8px] text-slate-400 font-black uppercase mt-1">VÀNG</div>
                    </div>
                    <div className="text-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-auto mb-1.5"></div>
                        <div className="text-xl font-black text-slate-900 leading-none">{stats.rankCounts.silver}</div>
                        <div className="text-[8px] text-slate-400 font-black uppercase mt-1">BẠC</div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Cập nhật lúc: <span className="text-slate-900 font-bold">{displayMonthYear}</span></span>
                </div>
                <Button
                    onClick={handleDownloadImage}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md border-none px-6 rounded-full"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Tải ảnh báo cáo
                </Button>
            </div>

            <div ref={captureRef} className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative p-8">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600"></div>

                {/* Visual Header for Capture */}
                <div className="bg-gradient-to-b from-emerald-50/30 to-white p-10 border-b border-slate-50 relative overflow-hidden text-center rounded-3xl mb-8">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/20 rounded-full blur-[100px] -mr-64 -mt-64"></div>

                    <div className="relative z-10 space-y-4">
                        <h2 className="text-4xl font-extrabold uppercase tracking-tight text-slate-900">
                            Thưởng Danh Hiệu <span className="text-emerald-600">Manulife Pro</span>
                        </h2>
                        <div className="h-1.5 w-32 bg-emerald-500 mx-auto rounded-full shadow-[0_2px_8px_rgba(16,185,129,0.3)]"></div>
                    </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm manulife-pro-table">
                    <Table className="border-separate border-spacing-y-1">
                        <TableHeader>
                            <TableRow className="bg-emerald-600 hover:bg-emerald-600 border-none overflow-hidden">
                                <TableHead className="w-16 text-center text-white font-black uppercase text-[10px] tracking-widest border-none first:rounded-l-xl">STT</TableHead>
                                <TableHead className="text-white font-black uppercase text-[10px] tracking-widest py-4 border-none">Đại lý</TableHead>
                                <TableHead className="text-white font-black uppercase text-[10px] tracking-widest border-none">Mã số</TableHead>
                                <TableHead className="text-white font-black uppercase text-[10px] tracking-widest border-none">Manulife Pro</TableHead>
                                <TableHead className="text-white font-black uppercase text-[10px] tracking-widest border-none">Tháng thăng hạng</TableHead>
                                <TableHead className="text-right text-white font-black uppercase text-[10px] tracking-widest border-none">FYP Tháng T</TableHead>
                                <TableHead className="text-right text-white font-black uppercase text-[10px] tracking-widest border-none">Mức Thưởng</TableHead>
                                <TableHead className="text-right text-white font-black uppercase text-[10px] tracking-widest leading-relaxed border-none last:rounded-r-xl">
                                    FYP Còn thiếu để đạt<br />mức thưởng cao hơn
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="bg-transparent">
                            {data.map((agent) => (
                                <TableRow key={agent.agent_code} className="bg-slate-50 hover:bg-emerald-50 transition-all group rounded-xl border-none shadow-sm h-12">
                                    <TableCell className="text-center font-mono text-xs text-slate-400 first:rounded-l-xl border-none">{agent.stt}</TableCell>
                                    <TableCell className="border-none">
                                        <div className="font-bold text-slate-900 text-sm">{agent.full_name}</div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500 border-none">{agent.agent_code}</TableCell>
                                    <TableCell className="border-none">
                                        <Badge className={`font-black text-[10px] px-3 py-1 tracking-tight rounded-full ${getProBadgeColor(agent.pro_type)}`}>
                                            {agent.pro_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="border-none">
                                        {editingCode === agent.agent_code ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    placeholder="mm/yyyy"
                                                    className="w-24 h-8 bg-white border-emerald-500 text-sm text-emerald-600 rounded-lg"
                                                    autoFocus
                                                />
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => handleSaveMonth(agent.agent_code)}>
                                                    <Save className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div
                                                className="text-sm text-slate-500 cursor-pointer hover:text-emerald-600 transition-colors flex items-center gap-2"
                                                onClick={() => {
                                                    setEditingCode(agent.agent_code);
                                                    setEditValue(agent.promo_month);
                                                }}
                                            >
                                                {agent.promo_month || "---"}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-900 tabular-nums text-sm border-none">
                                        {formatCurrency(agent.monthly_fyp)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-yellow-600 tabular-nums text-sm border-none">
                                        {agent.bonus_amount > 0 ? `+ ${formatCurrency(agent.bonus_amount)}` : "---"}
                                    </TableCell>
                                    <TableCell className="text-right last:rounded-r-xl border-none">
                                        <span className={`font-bold tabular-nums text-sm ${agent.remaining_fyp > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                            {agent.remaining_fyp > 0 ? formatCurrency(agent.remaining_fyp) : (agent.monthly_fyp > 0 ? "MAX" : "---")}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Bonus Reference Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-emerald-500" />
                        Bảng Quy Định Mức Thưởng Manulife Pro
                    </h3>
                </div>
                <div className="p-8 pb-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Platinum */}
                        <div className="space-y-4 text-sm">
                            <h4 className="font-black text-emerald-600 uppercase flex items-center gap-2 border-b-2 border-emerald-500/20 pb-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                Bạch Kim
                            </h4>
                            <div className="space-y-1">
                                <div className="flex justify-between p-2.5 bg-emerald-50/50 rounded-xl"><span>≥ 120.000</span> <span className="font-black text-emerald-700">20.000</span></div>
                                <div className="flex justify-between p-2.5"><span>100.000 - 119.999</span> <span className="font-black text-emerald-700">16.000</span></div>
                                <div className="flex justify-between p-2.5 bg-emerald-50/50 rounded-xl"><span>80.000 - 99.999</span> <span className="font-black text-emerald-700">12.000</span></div>
                                <div className="flex justify-between p-2.5"><span>60.000 - 79.999</span> <span className="font-black text-emerald-700">10.000</span></div>
                                <div className="flex justify-between p-2.5 bg-emerald-50/50 rounded-xl"><span>45.000 - 59.999</span> <span className="font-black text-emerald-700">8.000</span></div>
                                <div className="flex justify-between p-2.5"><span>30.000 - 44.999</span> <span className="font-black text-emerald-700">4.000</span></div>
                                <div className="flex justify-between p-2.5 bg-emerald-50/50 rounded-xl"><span>15.000 - 29.999</span> <span className="font-black text-emerald-700">2.000</span></div>
                            </div>
                        </div>

                        {/* Gold */}
                        <div className="space-y-4 text-sm">
                            <h4 className="font-black text-yellow-600 uppercase flex items-center gap-2 border-b-2 border-yellow-500/20 pb-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                Vàng
                            </h4>
                            <div className="space-y-1">
                                <div className="flex justify-between p-2.5 bg-yellow-50/30 rounded-xl"><span>≥ 60.000</span> <span className="font-black text-yellow-700">7.000</span></div>
                                <div className="flex justify-between p-2.5"><span>45.000 - 59.999</span> <span className="font-black text-yellow-700">5.000</span></div>
                                <div className="flex justify-between p-2.5 bg-yellow-50/30 rounded-xl"><span>30.000 - 44.999</span> <span className="font-black text-yellow-700">3.000</span></div>
                                <div className="flex justify-between p-2.5"><span>15.000 - 29.999</span> <span className="font-black text-yellow-700">1.500</span></div>
                            </div>
                        </div>

                        {/* Silver */}
                        <div className="space-y-4 text-sm">
                            <h4 className="font-black text-slate-500 uppercase flex items-center gap-2 border-b-2 border-slate-500/20 pb-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                                Bạc
                            </h4>
                            <div className="space-y-1">
                                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl"><span>≥ 45.000</span> <span className="font-black text-slate-700">3.000</span></div>
                                <div className="flex justify-between p-2.5"><span>30.000 - 44.999</span> <span className="font-black text-slate-700">3.000</span></div>
                                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl"><span>15.000 - 29.999</span> <span className="font-black text-slate-700">1.500</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
