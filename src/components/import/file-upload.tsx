"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileType, CheckCircle2, AlertCircle, Loader2, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FileUploadProps {
    title: string;
    description: string;
    endpoint: string;
    accept: string;
    onUploadSuccess?: () => void;
    sampleUrl?: string; // New prop for dynamic sample URL
    sampleFileName?: string; // New prop for downloaded filename
}

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function FileUpload({
    title,
    description,
    endpoint,
    accept,
    onUploadSuccess,
    sampleUrl = '/sample_agents.csv', // Default fallback
    sampleFileName = 'Mau_Du_Lieu.csv'
}: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);
    const [mode, setMode] = useState<"update" | "replace">("update");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleDownloadSample = () => {
        const link = document.createElement('a');
        link.href = sampleUrl;
        link.download = sampleFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("mode", mode);

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                setResult({ success: true, count: data.count });
                setFile(null);
                if (onUploadSuccess) {
                    onUploadSuccess();
                }
            } else {
                setResult({ success: false, error: data.error || "Upload failed" });
            }
        } catch (error) {
            setResult({ success: false, error: "An unexpected error occurred" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Upload className="w-5 h-5 text-blue-600" />
                            {title}
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadSample} className="gap-2 text-xs">
                        <Download className="w-4 h-4" /> Tải mẫu
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 border-slate-300 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FileType className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500">
                                {file ? <span className="font-semibold text-blue-600">{file.name}</span> : "Click to select or drag and drop"}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">CSV or Excel (.xlsx, .xls) files</p>
                        </div>
                        <input type="file" className="hidden" accept={accept} onChange={handleFileChange} disabled={isUploading} />
                    </label>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-medium">Chế độ nhập liệu:</Label>
                    <RadioGroup defaultValue="update" value={mode} onValueChange={(v) => setMode(v as any)} className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="update" id="import-update" />
                            <Label htmlFor="import-update" className="font-normal">Cập nhật (Thêm mới & Cập nhật đè)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="replace" id="import-replace" />
                            <Label htmlFor="import-replace" className="font-normal text-red-600">Thay thế toàn bộ (Xóa dữ liệu cũ)</Label>
                        </div>
                    </RadioGroup>
                </div>

                {result && (
                    <div className={`p-3 rounded-md flex items-center gap-3 text-sm ${result.success ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                        }`}>
                        {result.success ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Successfully imported {result.count} records.</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-4 h-4" />
                                <span>Error: {result.error}</span>
                            </>
                        )}
                    </div>
                )}

                <Button
                    className="w-full"
                    disabled={!file || isUploading}
                    onClick={handleUpload}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        "Import Data"
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
