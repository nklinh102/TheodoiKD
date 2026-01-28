"use client";

import { MdrtProgressTable } from "./components/mdrt-progress-table";
import { MdrtAgentsTable } from "./components/mdrt-agents-table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useRef } from "react";

const MdrtPageContent = () => {
    const captureRef = useRef<HTMLDivElement>(null);
    const { uploadDate } = MdrtAgentsTable.useMdrtFilter();

    // Format display date from SOP (YYYY-MM-DD -> DD/MM/YYYY)
    const formattedUpdateDate = uploadDate ? (() => {
        const [y, m, d] = uploadDate.split('-');
        return `${d}/${m}/${y}`;
    })() : new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    // Format month for title (taken from SOP date if possible)
    const displayMonth = uploadDate ? (() => {
        const [y, m] = uploadDate.split('-');
        return `${parseInt(m)}/${y}`;
    })() : new Date().toLocaleDateString('vi-VN', {
        month: 'numeric',
        year: 'numeric'
    });

    const handleDownloadImage = async () => {
        if (!captureRef.current) return;

        try {
            const { toPng } = await import('html-to-image');
            const originalElement = captureRef.current;

            // Create a temporary container with fixed desktop width
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'fixed';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '0';
            tempContainer.style.width = '1200px';
            tempContainer.style.minWidth = '1200px';
            tempContainer.style.maxWidth = '1200px';
            tempContainer.style.zIndex = '-1';
            tempContainer.style.backgroundColor = '#0f172a';

            // Clone the element
            const clonedElement = originalElement.cloneNode(true) as HTMLElement;
            clonedElement.style.width = '1200px';
            clonedElement.style.minWidth = '1200px';
            clonedElement.style.maxWidth = '1200px';

            // Append to body
            tempContainer.appendChild(clonedElement);
            document.body.appendChild(tempContainer);

            // Wait for images and layout to settle
            await new Promise(resolve => setTimeout(resolve, 300));

            const targetWidth = 1200;
            const targetHeight = tempContainer.scrollHeight;

            const dataUrl = await toPng(tempContainer, {
                cacheBust: true,
                backgroundColor: '#0f172a',
                pixelRatio: 2,
                width: targetWidth,
                height: targetHeight,
                style: {
                    overflow: 'visible',
                    borderRadius: '0',
                }
            });

            // Clean up
            document.body.removeChild(tempContainer);

            const link = document.createElement('a');
            link.download = `MDRT_T${displayMonth.replace('/', '_')}_Update_${formattedUpdateDate.replace(/\//g, '-')}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Lỗi tải ảnh:', error);
            alert('Không thể tải ảnh. Vui lòng thử lại.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Filter Buttons and Download - Top Right */}
                <div className="flex justify-end gap-3">
                    <MdrtAgentsTable.FilterButtons />
                    <Button
                        onClick={handleDownloadImage}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs"
                    >
                        <Download className="w-3 h-3" />
                        Tải ảnh
                    </Button>
                </div>

                {/* Capture Area */}
                <div ref={captureRef} className="relative space-y-6 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6 rounded-xl no-scrollbar overflow-hidden">
                    {/* Watermark Logo - Background Overlay */}
                    <div className="absolute bottom-6 right-6 opacity-10 pointer-events-none select-none z-20">
                        <img
                            src="/images/mdrtlogo.png"
                            alt="MDRT Logo"
                            className="h-64 w-auto object-contain"
                        />
                    </div>

                    {/* Header with Title */}
                    <div className="relative z-10 text-center space-y-2">
                        <h1 className="text-4xl font-bold text-white whitespace-nowrap">
                            TIẾN ĐỘ MDRT THÁNG {displayMonth}
                        </h1>
                        <p className="text-sm text-blue-300">
                            Dữ liệu cập nhật đến <span className="font-bold text-emerald-400">{formattedUpdateDate}</span>
                        </p>
                    </div>

                    {/* MDRT Progress Table - Horizontal */}
                    <div className="relative z-10 w-full">
                        <MdrtProgressTable />
                    </div>

                    {/* Agents Tracking Table */}
                    <div className="relative z-10 w-full">
                        <MdrtAgentsTable.TableOnly />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function MdrtPage() {
    return (
        <MdrtAgentsTable.Provider>
            <MdrtPageContent />
        </MdrtAgentsTable.Provider>
    );
}
