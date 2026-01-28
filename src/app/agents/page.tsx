"use client";

import { useState, useEffect, useMemo } from "react";
import { FileUpload } from "@/components/import/file-upload";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Search,
    Users,
    ChevronLeft,
    ChevronRight,
    Table as TableIcon,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Plus,
    Trash2,
    Pencil,
    X,
    Filter,
    Download
} from "lucide-react";
import { AgentFormDialog } from "@/components/agents/agent-form-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Agent, Rank, AgentStatus } from "@/types/database";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from 'xlsx';

type SortField = 'stt' | 'agent_code' | 'full_name' | 'join_date' | 'rank' | 'status' | 'manager_code' | 'recruiter_code';
type SortDirection = 'asc' | 'desc';

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Filters
    const [filters, setFilters] = useState({
        agent_code: "",
        full_name: "",
        rank: "",
        manager_code: "",
        recruiter_code: "",
        phone: "",
        join_date: "",
        manager_name: "",
        group_code: "" // Added group_code filter
    });

    // Sorting
    const [sortField, setSortField] = useState<SortField>('agent_code');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // CRUD State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [formData, setFormData] = useState<Partial<Agent>>({});

    // Agent Map for Manager Name Lookup
    const agentMap = useMemo(() => {
        const map = new Map<string, string>();
        agents.forEach(a => map.set(a.agent_code, a.full_name));
        return map;
    }, [agents]);

    useEffect(() => {
        fetchAgents();
    }, []);

    async function fetchAgents() {
        try {
            const res = await fetch("/api/agents");
            const result = await res.json();
            if (result.success) {
                setAgents(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch agents", error);
        } finally {
            setLoading(false);
        }
    }

    // Handlers
    const handleAdd = () => {
        setFormData({
            rank: 'FA',
            status: 'Active',
            join_date: new Date().toISOString().split('T')[0]
        });
        setIsAddOpen(true);
    };

    const handleEdit = (agent: Agent) => {
        setSelectedAgent(agent);
        // setFormData({ ...agent }); // No longer needed
        setIsEditOpen(true);
    };

    const handleDelete = (agent: Agent) => {
        setSelectedAgent(agent);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedAgent) return;
        try {
            const res = await fetch(`/api/agents/${selectedAgent.agent_code}`, {
                method: "DELETE"
            });
            const result = await res.json();
            if (result.success) {
                toast({ title: "Thành công", description: "Đã xóa đại lý" });
                setIsDeleteOpen(false);
                fetchAgents();
            } else {
                toast({ title: "Lỗi", description: result.error, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Lỗi", description: "Không thể xóa", variant: "destructive" });
        }
    };

    const confirmDeleteAll = async () => {
        try {
            const res = await fetch(`/api/agents?all=true`, {
                method: "DELETE"
            });
            const result = await res.json();
            if (result.success) {
                toast({ title: "Thành công", description: "Đã xóa toàn bộ danh sách" });
                setIsDeleteAllOpen(false);
                fetchAgents();
            } else {
                toast({ title: "Lỗi", description: result.error, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Lỗi", description: "Không thể xóa tất cả", variant: "destructive" });
        }
    };

    const handleExportExcel = () => {
        if (agents.length === 0) {
            toast({ title: "Thông báo", description: "Danh sách trống, không có dữ liệu để xuất." });
            return;
        }

        const exportData = agents.map(agent => ({
            "Mã số": agent.agent_code,
            "Họ tên": agent.full_name,
            "Cấp bậc": agent.rank,
            "Trạng thái": agent.status,
            "Ngày gia nhập": agent.join_date ? new Date(agent.join_date).toLocaleDateString('en-GB') : "",
            "Mã quản lý": agent.manager_code || "",
            "Tên quản lý": agent.manager_name || (agent.manager_code ? agentMap.get(agent.manager_code) : "") || "",
            "Mã tuyển dụng": agent.recruiter_code || "",
            "Điện thoại": agent.phone || "",
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachDaiLy");
        XLSX.writeFile(wb, `Danh_Sach_Dai_Ly_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({ title: "Thành công", description: "Đã tải xuống file Excel danh sách đại lý." });
    };

    // Sort Handler
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Derived Data & Filtering & Sorting
    const processedAgents = useMemo(() => {
        let result = agents.filter(agent => {
            const matchesCode = filters.agent_code ? agent.agent_code.toLowerCase().includes(filters.agent_code.toLowerCase()) : true;
            const matchesName = filters.full_name ? agent.full_name.toLowerCase().includes(filters.full_name.toLowerCase()) : true;
            const matchesRank = filters.rank && filters.rank !== 'all' ? agent.rank === filters.rank : true;
            const matchesManager = filters.manager_code ? (agent.manager_code || "").toLowerCase().includes(filters.manager_code.toLowerCase()) : true;
            const matchesRecruiter = filters.recruiter_code ? (agent.recruiter_code || "").toLowerCase().includes(filters.recruiter_code.toLowerCase()) : true;
            const matchesPhone = filters.phone ? (agent.phone || "").includes(filters.phone) : true;

            // New Filters
            const matchesJoinDate = filters.join_date ? (agent.join_date || "").includes(filters.join_date) : true;
            const managerName = agent.manager_name || (agent.manager_code ? agentMap.get(agent.manager_code) : "") || "";
            const matchesManagerName = filters.manager_name ? managerName.toLowerCase().includes(filters.manager_name.toLowerCase()) : true;
            const matchesGroup = filters.group_code ? (agent.group_code || "").toLowerCase().includes(filters.group_code.toLowerCase()) : true;

            return matchesCode && matchesName && matchesRank && matchesManager && matchesRecruiter && matchesPhone && matchesJoinDate && matchesManagerName && matchesGroup;
        });

        // Sort
        result.sort((a, b) => {
            let valA: any = sortField === 'stt' ? 0 : a[sortField];
            let valB: any = sortField === 'stt' ? 0 : b[sortField];

            if (sortField === 'rank') {
                const getRankValue = (agent: Agent) => agent.status === 'Terminated' ? 'Ter' : agent.rank;
                valA = getRankValue(a);
                valB = getRankValue(b);
            } else if (sortField === 'join_date') {
                valA = new Date(a.join_date || 0).getTime();
                valB = new Date(b.join_date || 0).getTime();
            } else if (sortField === 'stt') {
                valA = a.agent_code;
                valB = b.agent_code;
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [agents, filters, sortField, sortDirection, agentMap]);

    // Rank Statistics (Excluding Terminated)
    const rankStats = useMemo(() => {
        // Filter out Terminated agents
        const activeAgents = processedAgents.filter(a => a.status !== 'Terminated' && a.rank !== 'Ter' as any);

        const stats: Record<string, number> = {};
        activeAgents.forEach(a => {
            const r = a.rank || 'Unknown';
            stats[r] = (stats[r] || 0) + 1;
        });

        // Define order
        const order = ['FA', 'UM', 'SUM', 'DM', 'SDM', 'BM', 'AM', 'SA'];
        return order.map(rank => ({ rank, count: stats[rank] || 0 }));
    }, [processedAgents]);


    // Pagination Logic
    const totalPages = Math.ceil(processedAgents.length / pageSize);
    const paginatedAgents = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return processedAgents.slice(startIndex, startIndex + pageSize);
    }, [processedAgents, currentPage, pageSize]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="ml-2 h-3 w-3 text-slate-400" />;
        return sortDirection === 'asc' ?
            <ArrowUp className="ml-2 h-3 w-3 text-blue-600" /> :
            <ArrowDown className="ml-2 h-3 w-3 text-blue-600" />;
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB");
    };

    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quản lý Đại lý</h1>
                    <p className="text-slate-500 mt-1">Danh sách đội ngũ và công cụ nhập liệu.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" onClick={() => setIsDeleteAllOpen(true)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Xóa tất cả
                    </Button>
                    <Button variant="outline" onClick={handleExportExcel} className="hidden md:flex">
                        <Download className="w-4 h-4 mr-2" /> Xuất Excel
                    </Button>
                    <Button onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" /> Thêm mới
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-4">
                    <TabsTrigger value="list" className="flex items-center gap-2">
                        <TableIcon className="w-4 h-4" />
                        Danh sách
                    </TabsTrigger>
                    <TabsTrigger value="import" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Nhập dữ liệu
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-lg font-medium">Danh sách nhân sự</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Rank Statistics */}
                            <div className="grid grid-cols-4 md:grid-cols-9 gap-2 mb-4 p-4 bg-slate-50 rounded-lg border">
                                <div className="font-semibold text-slate-700 flex items-center">Thống kê:</div>
                                {rankStats.map(stat => (
                                    <div key={stat.rank} className="flex flex-col items-center justify-center p-2 bg-white rounded border shadow-sm">
                                        <span className="text-xs text-slate-500 font-medium">{stat.rank}</span>
                                        <span className="text-sm font-bold text-blue-600">{stat.count}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-md border border-slate-200 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="w-[50px] text-center font-bold text-slate-700">STT</TableHead>
                                            <TableHead className="min-w-[100px] cursor-pointer" onClick={() => handleSort('agent_code')}>
                                                <div className="flex items-center font-semibold text-slate-700">Mã ĐL <SortIcon field="agent_code" /></div>
                                            </TableHead>
                                            <TableHead className="min-w-[150px] cursor-pointer" onClick={() => handleSort('full_name')}>
                                                <div className="flex items-center font-semibold text-slate-700">Họ Tên <SortIcon field="full_name" /></div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort('join_date')}>
                                                <div className="flex items-center font-semibold text-slate-700">Ngày Gia Nhập <SortIcon field="join_date" /></div>
                                            </TableHead>
                                            <TableHead className="cursor-pointer" onClick={() => handleSort('rank')}>
                                                <div className="flex items-center font-semibold text-slate-700">Chức danh <SortIcon field="rank" /></div>
                                            </TableHead>
                                            <TableHead className="font-semibold text-slate-700">Mã Quản Lý</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Tên Quản Lý</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Mã Tuyển Dụng</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Điện Thoại</TableHead>
                                            <TableHead className="font-semibold text-slate-700">Mã tổ</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                        {/* Filter Row */}
                                        <TableRow className="bg-slate-50 hover:bg-slate-50 border-t-0">
                                            <TableHead></TableHead>
                                            <TableHead>
                                                <Input className="h-8 text-xs bg-white" placeholder="Lọc mã" value={filters.agent_code} onChange={e => handleFilterChange('agent_code', e.target.value)} />
                                            </TableHead>
                                            <TableHead>
                                                <Input className="h-8 text-xs bg-white" placeholder="Lọc tên" value={filters.full_name} onChange={e => handleFilterChange('full_name', e.target.value)} />
                                            </TableHead>
                                            <TableHead>
                                                <Input className="h-8 text-xs bg-white" placeholder="Lọc ngày" value={filters.join_date} onChange={e => handleFilterChange('join_date', e.target.value)} />
                                            </TableHead>
                                            <TableHead>
                                                <Select value={filters.rank} onValueChange={(v) => handleFilterChange('rank', v)}>
                                                    <SelectTrigger className="h-8 text-xs bg-white w-[80px]"><SelectValue placeholder="All" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All</SelectItem>
                                                        <SelectItem value="FA">FA</SelectItem>
                                                        <SelectItem value="UM">UM</SelectItem>
                                                        <SelectItem value="SUM">SUM</SelectItem>
                                                        <SelectItem value="DM">DM</SelectItem>
                                                        <SelectItem value="SDM">SDM</SelectItem>
                                                        <SelectItem value="BM">BM</SelectItem>
                                                        <SelectItem value="AM">AM</SelectItem>
                                                        <SelectItem value="SA">SA</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableHead>
                                            <TableHead>
                                                <Input className="h-8 text-xs bg-white" placeholder="Lọc mã QL" value={filters.manager_code} onChange={e => handleFilterChange('manager_code', e.target.value)} />
                                            </TableHead>
                                            <TableHead>
                                                <Input className="h-8 text-xs bg-white" placeholder="Lọc tên QL" value={filters.manager_name} onChange={e => handleFilterChange('manager_name', e.target.value)} />
                                            </TableHead>
                                            <TableHead>
                                                <Input className="h-8 text-xs bg-white" placeholder="Lọc mã TD" value={filters.recruiter_code} onChange={e => handleFilterChange('recruiter_code', e.target.value)} />
                                            </TableHead>
                                            <TableHead>
                                                <Input className="h-8 text-xs bg-white" placeholder="Lọc SĐT" value={filters.phone} onChange={e => handleFilterChange('phone', e.target.value)} />
                                            </TableHead>
                                            <TableHead>
                                                <Input className="h-8 text-xs bg-white" placeholder="Lọc Mã tổ" value={filters.group_code} onChange={e => handleFilterChange('group_code', e.target.value)} />
                                            </TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedAgents.length > 0 ? (
                                            paginatedAgents.map((agent, index) => {
                                                const stt = (currentPage - 1) * pageSize + index + 1;
                                                let rankDisplay = agent.rank as string;
                                                let rankBadgeClass = "bg-blue-50 text-blue-700 border-blue-100";

                                                if (agent.status === "Terminated") {
                                                    rankDisplay = "Ter";
                                                    rankBadgeClass = "bg-slate-100 text-slate-500 border-slate-200";
                                                } else if (agent.rank === "SA") {
                                                    rankDisplay = "SA";
                                                    rankBadgeClass = "bg-purple-50 text-purple-700 border-purple-100";
                                                }
                                                // Lookup Manager Name
                                                // Priority: 1. Explicit name from DB (manager_name) 2. Derived from manager_code lookup
                                                const managerName = agent.manager_name || (agent.manager_code ? agentMap.get(agent.manager_code) : null) || "-";

                                                return (
                                                    <TableRow key={agent.agent_code} className="hover:bg-slate-50/50 group">
                                                        <TableCell className="text-center text-slate-500 font-mono text-xs">{stt}</TableCell>
                                                        <TableCell className="font-mono text-sm font-semibold">{agent.agent_code}</TableCell>
                                                        <TableCell className="font-medium text-slate-900">{agent.full_name}</TableCell>
                                                        <TableCell className="text-sm text-slate-600">{formatDate(agent.join_date)}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={`font-mono border font-medium ${rankBadgeClass}`}>{rankDisplay}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-slate-600">{agent.manager_code || "-"}</TableCell>
                                                        <TableCell className="text-sm text-slate-600">{managerName}</TableCell>
                                                        <TableCell className="text-sm text-slate-600">{agent.recruiter_code || "-"}</TableCell>
                                                        <TableCell className="text-sm text-slate-600">{agent.phone || "-"}</TableCell>
                                                        <TableCell className="text-sm text-slate-600">{agent.group_code || "-"}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEdit(agent)}>
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(agent)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={10} className="h-32 text-center text-slate-500">
                                                    Không tìm thấy kết quả phù hợp.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-xs text-slate-500">
                                    Hiển thị {processedAgents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, processedAgents.length)} / {processedAgents.length}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 mr-4">
                                        <span className="text-xs text-slate-500">Rows:</span>
                                        <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                                            <SelectTrigger className="w-[60px] h-7 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10">10</SelectItem>
                                                <SelectItem value="20">20</SelectItem>
                                                <SelectItem value="50">50</SelectItem>
                                                <SelectItem value="100">100</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="h-7 w-7 p-0">
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="text-xs font-medium w-16 text-center">
                                        {currentPage} / {totalPages || 1}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="h-7 w-7 p-0">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="import">
                    <div className="grid md:grid-cols-2 gap-6">
                        <FileUpload
                            title="Tải lên danh sách Đại lý"
                            description="Chọn file CSV hoặc Excel (.xlsx, .xls)..."
                            endpoint="/api/import/agents"
                            accept=".csv, .xlsx, .xls"
                            sampleUrl="/sample_agents.xlsx"
                            sampleFileName="Mau_Danh_Sach_Dai_Ly.xlsx"
                            onUploadSuccess={() => {
                                fetchAgents();
                                toast({ title: "Thành công", description: "Đữ liệu đã được cập nhật!" });
                                // Optional: switch back to list tab
                                // const listTrigger = document.querySelector('[value="list"]') as HTMLElement;
                                // if (listTrigger) listTrigger.click();
                            }}
                        />
                        <Card className="border-dashed bg-slate-50/50">
                            <CardHeader>
                                <CardTitle className="text-lg">Hướng dẫn nhập liệu</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-slate-600 space-y-2">
                                <p>• Chọn chế độ <strong>Cập nhật</strong> để thêm/sửa dữ liệu.</p>
                                <p>• Chọn chế độ <strong>Thay thế</strong> để xóa hết và nhập mới.</p>
                                <p className="mt-4 font-semibold text-slate-900">Các cột hỗ trợ:</p>
                                <ul className="list-disc pl-4 text-xs">
                                    <li>Mã số / MS / Code</li>
                                    <li>Họ tên / Tên / Name</li>
                                    <li>Quản lý / Mã quản lý / Manager</li>
                                    <li>Người tuyển dụng / Mã tuyển dụng</li>
                                    <li>Điện thoại / SĐT / Phone</li>
                                    <li>Ngày gia nhập / Join Date</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Added Dialogs for CRUD */}
            {/* Add/Edit Dialog */}
            {/* Added Dialogs for CRUD */}
            {/* Add/Edit Dialog */}
            <AgentFormDialog
                open={isAddOpen || isEditOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsAddOpen(false);
                        setIsEditOpen(false);
                    }
                }}
                initialData={isEditOpen ? selectedAgent : null}
                onSuccess={fetchAgents}
                agents={agents}
            />

            {/* Confirm Delete Single */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa đại lý <strong>{selectedAgent?.full_name} ({selectedAgent?.agent_code})</strong> không?
                            Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Hủy</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Xóa ngay</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete All */}
            <Dialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">CẢNH BÁO: Xóa toàn bộ dữ liệu</DialogTitle>
                        <DialogDescription>
                            Bạn đang chuẩn bị xóa <strong>TOÀN BỘ</strong> danh sách đại lý trong hệ thống.
                            <br /><br />
                            Dữ liệu sẽ mất vĩnh viễn và không thể khôi phục.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteAllOpen(false)}>Hủy</Button>
                        <Button variant="destructive" onClick={confirmDeleteAll}>XÁC NHẬN XÓA HẾT</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
