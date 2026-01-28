"use client";

import { FileUpload } from "@/components/import/file-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Users, FileText } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Cấu hình & Nhập dữ liệu</h1>
                <p className="text-slate-500 mt-2">Quản lý nguồn dữ liệu CSV và đồng bộ hóa với hệ thống quản trị.</p>
            </div>

            <div className="grid gap-6">
                <Tabs defaultValue="import" className="w-full">
                    <TabsList className="bg-white border text-slate-600">
                        <TabsTrigger value="import" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                            <Database className="w-4 h-4 mr-2" />
                            Nhập dữ liệu CSV
                        </TabsTrigger>
                        <TabsTrigger value="general" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                            Cài đặt chung
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="import" className="mt-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <FileUpload
                                title="Hồ sơ Đại lý (Data CA)"
                                description="Tải lên file 'Data CA.csv' để cập nhật thông tin nhân sự và cơ cấu quản lý."
                                endpoint="/api/import/agents"
                                accept=".csv"
                            />

                            <FileUpload
                                title="Hợp đồng nộp/cấp"
                                description="Tải lên file 'HĐ nộp cấp.csv' để cập nhật doanh số FYP và trạng thái hợp đồng."
                                endpoint="/api/import/contracts"
                                accept=".csv"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="general" className="mt-6">
                        <div className="bg-white p-6 rounded-lg border border-slate-200">
                            <p className="text-slate-500">Các tùy chọn cấu hình hệ thống khác sẽ được bổ sung tại đây.</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
