"use client";

import { useEffect, useState, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, Camera, CheckCircle2, AlertCircle, TrendingUp, Calendar, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface MaintenanceAgent {
    stt: number;
    agent_code: string;
    full_name: string;
    pro_type: string;
    promo_month: string;
    period: string;
    current_fyp: number;
    active_months: number;
    working_months: number;
    persistence_rate: number;
    months_to_moc: number;
    note: string;
}

export function ManulifeProMaintenanceTable() {
    const [data, setData] = useState<MaintenanceAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingFyp, setUploadingFyp] = useState(false);
    const [uploadingActive, setUploadingActive] = useState(false);
    const [meta, setMeta] = useState<any>({});
    const captureRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/manulife-pro/maintenance");
            const result = await res.json();
            if (result.success) {
                setData(result.data);
                setMeta(result.meta);
            }
        } catch (error) {
            console.error("Lỗi lấy dữ liệu duy trì Pro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'fyp' | 'active') => {
        const file = event.target.files?.[0];
        if (!file) return;

        const setUploading = type === 'fyp' ? setUploadingFyp : setUploadingActive;
        const endpoint = type === 'fyp' ? '/api/manulife-pro/maintenance/upload-fyp' : '/api/manulife-pro/maintenance/upload-active-months';

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(endpoint, {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                toast({
                    title: "Thành công",
                    description: `Đã cập nhật dữ liệu ${type === 'fyp' ? 'FYP' : 'Tháng hoạt động'}`,
                });
                fetchData();
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể tải lên tệp tin. Vui lòng kiểm tra định dạng.",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
            event.target.value = "";
        }
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

            await new Promise(resolve => setTimeout(resolve, 500));
            const { toPng } = await import('html-to-image');
            const targetHeight = element.getBoundingClientRect().height;

            const dataUrl = await toPng(element, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                pixelRatio: 2,
                width: targetWidth,
                height: targetHeight,
            });

            element.style.cssText = originalStyle;
            element.removeAttribute('data-capturing');

            const link = document.createElement('a');
            link.download = `Manulife_Pro_Maintenance_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Lỗi tải ảnh:', error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
    };

    const getStatusColor = (agent: MaintenanceAgent) => {
        const isPlatinum = agent.pro_type.includes("Bạch Kim");
        const isGold = agent.pro_type.includes("Vàng");

        const fypTarget = isPlatinum ? 600000 : (isGold ? 300000 : 100000);
        const monthTarget = isPlatinum ? 6 : (isGold ? 6 : 3);
        const persistenceTarget = 65;

        const fypPass = agent.current_fyp >= fypTarget;
        const monthPass = agent.active_months >= monthTarget;
        const persistencePass = agent.persistence_rate >= persistenceTarget;

        if (fypPass && monthPass && persistencePass) return "text-emerald-600";
        return "text-rose-600";
    };

    const getBadgeStyle = (type: string) => {
        if (type.includes("Bạch Kim")) return "bg-emerald-500 text-white";
        if (type.includes("Vàng")) return "bg-yellow-500 text-yellow-950";
        return "bg-slate-300 text-slate-900";
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                <p className="text-emerald-400 font-medium animate-pulse">Đang tải dữ liệu duy trì...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    <div className="relative">
                        <input
                            type="file"
                            id="fyp-upload"
                            className="hidden"
                            accept=".xlsx,.xls"
                            onChange={(e) => handleFileUpload(e, 'fyp')}
                            disabled={uploadingFyp}
                        />
                        <Button
                            asChild
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold"
                            disabled={uploadingFyp}
                        >
                            <label htmlFor="fyp-upload" className="cursor-pointer">
                                {uploadingFyp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                Cập nhật FYP 12T
                            </label>
                        </Button>
                    </div>
                    <div className="relative">
                        <input
                            type="file"
                            id="active-upload"
                            className="hidden"
                            accept=".xlsx,.xls"
                            onChange={(e) => handleFileUpload(e, 'active')}
                            disabled={uploadingActive}
                        />
                        <Button
                            asChild
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-bold"
                            disabled={uploadingActive}
                        >
                            <label htmlFor="active-upload" className="cursor-pointer">
                                {uploadingActive ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                Cập nhật Tháng HĐ
                            </label>
                        </Button>
                    </div>
                </div>
                <Button
                    onClick={handleDownloadImage}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full px-6"
                >
                    <Camera className="w-4 h-4 mr-2" />
                    Tải ảnh báo cáo
                </Button>
            </div>

            {/* Table Box */}
            <div ref={captureRef} className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-lg relative p-8">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-blue-500"></div>

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tight">
                            THEO DÕI DUY TRÌ <span className="text-emerald-600">MANULIFE PRO</span>
                        </h2>
                        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest italic">
                            Dữ liệu cập nhật dựa trên FYP 12 tháng và Tháng hoạt động
                        </p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                        Ngày báo cáo: {new Date().toLocaleDateString('vi-VN')}
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-900 hover:bg-slate-900 border-none">
                                <TableHead className="w-12 text-center text-white font-bold text-[10px] uppercase">STT</TableHead>
                                <TableHead className="text-white font-bold text-[10px] uppercase px-4 py-4">Đại lý</TableHead>
                                <TableHead className="text-white font-bold text-[10px] uppercase">Mã số</TableHead>
                                <TableHead className="text-white font-bold text-[10px] uppercase">Hạng</TableHead>
                                <TableHead className="text-white font-bold text-[10px] uppercase">Giai đoạn đánh giá</TableHead>
                                <TableHead className="text-right text-white font-bold text-[10px] uppercase">FYP Hiện tại<br />(nghìn VNĐ)</TableHead>
                                <TableHead className="text-center text-white font-bold text-[10px] uppercase">Tháng HĐ</TableHead>
                                <TableHead className="text-center text-white font-bold text-[10px] uppercase">Tỷ lệ duy trì</TableHead>
                                <TableHead className="text-white font-bold text-[10px] uppercase">Ghi chú Moc</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((agent) => (
                                <TableRow key={agent.agent_code} className="hover:bg-slate-50 border-b border-slate-50">
                                    <TableCell className="text-center font-mono text-xs text-slate-400">{agent.stt}</TableCell>
                                    <TableCell className="font-bold text-slate-800 text-sm">{agent.full_name}</TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500">{agent.agent_code}</TableCell>
                                    <TableCell>
                                        <Badge className={`text-[9px] font-black px-2 py-0.5 rounded-md ${getBadgeStyle(agent.pro_type)}`}>
                                            {agent.pro_type.replace('Manulife Pro ', '')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-[11px] text-slate-500 font-medium">{agent.period}</TableCell>
                                    <TableCell className="text-right font-bold tabular-nums text-sm">
                                        <div className="flex flex-col items-end">
                                            <span className={agent.current_fyp >= (agent.pro_type.includes("Bạch Kim") ? 600000 : agent.pro_type.includes("Vàng") ? 300000 : 100000) ? "text-emerald-600" : "text-rose-600"}>
                                                {formatCurrency(agent.current_fyp)}
                                            </span>
                                            {agent.current_fyp < (agent.pro_type.includes("Bạch Kim") ? 600000 : agent.pro_type.includes("Vàng") ? 300000 : 100000) && (
                                                <span className="text-[10px] text-slate-500 font-medium">
                                                    Thiếu: {formatCurrency((agent.pro_type.includes("Bạch Kim") ? 600000 : agent.pro_type.includes("Vàng") ? 300000 : 100000) - agent.current_fyp)}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-sm">
                                        <div className="flex flex-col items-center">
                                            <span className={agent.active_months >= (agent.pro_type.includes("Bạch Kim") || agent.pro_type.includes("Vàng") ? 6 : 3) ? "text-emerald-600" : "text-rose-600"}>
                                                {agent.active_months}
                                            </span>
                                            {agent.active_months < (agent.pro_type.includes("Bạch Kim") || agent.pro_type.includes("Vàng") ? 6 : 3) && (
                                                <span className="text-[10px] text-slate-500 font-medium">
                                                    Thiếu: {(agent.pro_type.includes("Bạch Kim") || agent.pro_type.includes("Vàng") ? 6 : 3) - agent.active_months}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-sm">
                                        <div className="flex flex-col items-center">
                                            {agent.working_months < 17 && agent.persistence_rate === 0 ? (
                                                <span className="text-slate-300">---</span>
                                            ) : (
                                                <>
                                                    <span className={agent.persistence_rate >= 65 ? "text-emerald-600" : "text-rose-600"}>
                                                        {agent.persistence_rate}%
                                                    </span>
                                                    {agent.persistence_rate < 65 && (
                                                        <span className="text-[10px] text-slate-500 font-medium">
                                                            Thiếu: {(65 - agent.persistence_rate).toFixed(1)}%
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-[11px] font-bold">
                                        {agent.months_to_moc >= 0 && agent.months_to_moc <= 3 ? (
                                            <div className="flex items-center text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 w-fit">
                                                Còn {agent.months_to_moc} tháng nữa đến MOC
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic font-normal">{agent.note}</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Legend / Goal Summary */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Mục tiêu Duy trì</p>
                            <p className="text-xs text-emerald-600/80 leading-relaxed font-medium mt-1">
                                FYP 12T: Bạc (100M), Vàng (300M), Bạch Kim (600M)
                            </p>
                        </div>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Tháng Hoạt Động</p>
                            <p className="text-xs text-blue-600/80 leading-relaxed font-medium mt-1">
                                Yêu cầu: Bạc (3 tháng), Vàng/Bạch Kim (6 tháng) có 1CC & 4M FYC
                            </p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-slate-500 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Tỷ Lệ Duy Trì</p>
                            <p className="text-xs text-slate-600/80 leading-relaxed font-medium mt-1">
                                Yêu cầu tối thiểu: 65% (TLDTHD năm 2)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
