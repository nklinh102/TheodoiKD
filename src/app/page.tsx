"use client";

import { useEffect, useState } from "react";
import { OverviewStats } from "@/components/dashboard/overview-stats";
import { ChartsContainer } from "@/components/dashboard/charts-container";
import { TopLists } from "@/components/dashboard/top-lists";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    fetchDashboardData();
  }, [month]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/overview?month=${month}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  const adjustMonth = (delta: number) => {
    const date = new Date(month + "-01");
    date.setMonth(date.getMonth() + delta);
    setMonth(date.toISOString().slice(0, 7));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return <div className="p-4 text-center">Không thể tải dữ liệu.</div>;

  return (
    <div className="space-y-8 pb-10">
      {/* Header Control */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">Tổng Quan Kinh Doanh</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Theo dõi hiệu quả hoạt động kinh doanh của đội ngũ</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => adjustMonth(-1)} className="h-9 w-9 text-slate-600 hover:text-blue-600 hover:bg-blue-50">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 font-bold text-sm w-[150px] justify-center text-slate-700">
            <Calendar className="h-4 w-4 text-indigo-500" />
            Tháng {month.split('-')[1]} - {month.split('-')[0]}
          </div>
          <Button variant="ghost" size="icon" onClick={() => adjustMonth(1)} className="h-9 w-9 text-slate-600 hover:text-blue-600 hover:bg-blue-50">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 1. Overview Stats Cards */}
      <OverviewStats data={data} />

      {/* 2. Main Charts Section */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <Card className="border-none shadow-md h-full bg-white/80 backdrop-blur-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-800 uppercase tracking-tight">Biểu đồ & Phân tích</h3>
            </div>
            <CardContent className="pt-8">
              <ChartsContainer data={data} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Top Lists Section */}
      <TopLists data={data} />

    </div>
  );
}
