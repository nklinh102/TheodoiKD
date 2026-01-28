
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, TrendingUp, Users } from "lucide-react";

interface StatsProps {
    stats: {
        submittedCount: number;
        submittedAPE: number;
        issuedCount: number;
        issuedAPE: number;
        pendingCount: number;
        submittedAgents: number;
        issuedAgents: number;
        submittedFYP: number;
        issuedFYP: number;
    }
}

export function ContractsStats({ stats }: StatsProps) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow py-0">
                <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" /> HĐ Nộp
                        </p>
                        <div className="p-1.5 bg-blue-50 rounded-full">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1.5">
                        <span className="text-3xl font-bold text-gray-900">{stats.submittedCount}</span>
                        <span className="text-xs text-muted-foreground">{stats.submittedAgents} Đại lý</span>
                    </div>

                    <div className="space-y-1 text-xs border-t pt-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">FYP:</span>
                            <span className="font-semibold">{formatCurrency(stats.submittedFYP)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">APE:</span>
                            <span className="font-semibold">{formatCurrency(stats.submittedAPE)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow py-0">
                <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" /> HĐ Cấp
                        </p>
                        <div className="p-1.5 bg-green-50 rounded-full">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1.5">
                        <span className="text-3xl font-bold text-gray-900">{stats.issuedCount}</span>
                        <span className="text-xs text-muted-foreground">{stats.issuedAgents} Đại lý</span>
                    </div>

                    <div className="space-y-1 text-xs border-t pt-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">FYP:</span>
                            <span className="font-semibold text-green-700">{formatCurrency(stats.issuedFYP)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">APE:</span>
                            <span className="font-semibold text-green-700">{formatCurrency(stats.issuedAPE)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-400 shadow-sm hover:shadow-md transition-shadow py-0">
                <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" /> Pending
                        </p>
                        <div className="p-1.5 bg-orange-50 rounded-full">
                            <Clock className="h-4 w-4 text-orange-600" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1.5">
                        <span className="text-3xl font-bold text-gray-900">{stats.pendingCount}</span>
                    </div>

                    <div className="text-xs text-gray-500 border-t pt-2">
                        <p>Hợp đồng nộp chưa cấp.</p>
                        <p>Cần bổ sung chứng từ.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
