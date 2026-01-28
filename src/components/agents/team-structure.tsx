
import { useState, useMemo, useRef, useEffect } from "react";
import { Agent } from "@/types/database";
import { toPng } from 'html-to-image';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ChevronRight, ChevronDown, User, Users, Search, MoveRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TeamStructureProps {
    agents: Agent[];
    agentStats?: Record<string, number>;
    onUpdate: () => void;
    virtualRootName?: string;
    onAddSubordinate?: (manager: Agent | null) => void;
}

interface TreeNode {
    agent: Agent;
    children: TreeNode[];
    level: number;
    directAgents: number;
    totalBranchAgents: number;
}

export function TeamStructure({ agents, agentStats = {}, onUpdate, virtualRootName = "Giám đốc Kinh doanh", onAddSubordinate }: TeamStructureProps) {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");

    // View Mode State
    const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
    const treeContainerRef = useRef<HTMLDivElement>(null);

    // Tree State
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [newManagerCode, setNewManagerCode] = useState<string>("");

    // Root Name State
    const [rootName, setRootName] = useState(virtualRootName);
    const [isEditingRoot, setIsEditingRoot] = useState(false);

    // Build Tree
    const treeData = useMemo(() => {
        const agentMap = new Map<string, TreeNode>();
        const forestRoots: TreeNode[] = [];

        // Initialize nodes
        agents.forEach(agent => {
            const direct = agentStats[agent.agent_code] || 0;
            agentMap.set(agent.agent_code, {
                agent,
                children: [],
                level: 0,
                directAgents: direct,
                totalBranchAgents: direct
            });
        });

        // Build hierarchy
        agents.forEach(agent => {
            const node = agentMap.get(agent.agent_code)!;
            const managerCode = agent.manager_code;

            if (managerCode && agentMap.has(managerCode)) {
                const managerNode = agentMap.get(managerCode)!;
                managerNode.children.push(node);
            } else {
                forestRoots.push(node);
            }
        });

        // Debug: Check for SM agents
        const smAgents = agents.filter(a => a.rank?.trim().toUpperCase() === 'SM');
        console.log('SM agents in data:', smAgents.map(a => ({
            code: a.agent_code,
            name: a.full_name,
            rank: a.rank,
            manager: a.manager_code,
            status: a.status
        })));
        console.log('Total agents:', agents.length);
        console.log('Forest roots:', forestRoots.map(r => ({
            code: r.agent.agent_code,
            name: r.agent.full_name,
            rank: r.agent.rank
        })));

        // Calculate Branch Agents (Post-order traversal via recursion)
        // Exclude SM rank from counts
        const calculateBranchStats = (node: TreeNode) => {
            let sumChildren = 0;
            node.children.forEach(child => {
                calculateBranchStats(child);
                sumChildren += child.totalBranchAgents;
            });

            // If this is an SM agent, don't count them in directAgents FOR PARENT
            // But SM's own totalBranchAgents should include their direct FA count
            const isSM = (node.agent.rank as string)?.trim().toUpperCase() === 'SM';
            const isSMGroup = (node.agent.rank as string) === 'TEAM';

            // For SM: totalBranchAgents = directAgents (FA) + sumChildren (FA's children)
            // For others: totalBranchAgents = directAgents + sumChildren
            node.totalBranchAgents = node.directAgents + sumChildren;

            // Debug SM agents
            if (isSM) {
                console.log('SM Agent stats:', {
                    name: node.agent.full_name,
                    code: node.agent.agent_code,
                    directAgents: node.directAgents,
                    sumChildren,
                    totalBranchAgents: node.totalBranchAgents,
                    childrenCount: node.children.length,
                    children: node.children.map(c => ({
                        name: c.agent.full_name,
                        rank: c.agent.rank
                    }))
                });
            }

            // Debug SM group
            if (isSMGroup) {
                console.log('SM Group stats:', {
                    name: node.agent.full_name,
                    directAgents: node.directAgents,
                    sumChildren,
                    totalBranchAgents: node.totalBranchAgents,
                    childrenCount: node.children.length,
                    children: node.children.map(c => ({
                        name: c.agent.full_name,
                        rank: c.agent.rank,
                        total: c.totalBranchAgents
                    }))
                });
            }
        };

        // Recursive level setting
        const setLevels = (nodes: TreeNode[], level: number) => {
            nodes.forEach(node => {
                node.level = level;
                setLevels(node.children, level + 1);
            });
        };

        forestRoots.forEach(calculateBranchStats);
        setLevels(forestRoots, 0);

        // If we have a virtual root, wrap the forest
        if (rootName) {
            const virtualRoot: TreeNode = {
                agent: {
                    agent_code: 'root',
                    full_name: rootName,
                    rank: 'CEO' as any, // Virtual Rank
                    status: 'Active',
                    join_date: '',
                },
                children: forestRoots,
                level: -1,
                directAgents: 0,
                totalBranchAgents: forestRoots.reduce((sum, n) => sum + n.totalBranchAgents, 0)
            };
            return [virtualRoot];
        }

        return forestRoots;
    }, [agents, rootName, agentStats]);

    // Auto-expand logic
    useEffect(() => {
        const allIds = new Set<string>(['root']);
        agents.forEach(a => allIds.add(a.agent_code));
        setExpandedNodes(allIds);

        // Optional: Log rank distribution to help debug
        // console.log("Ranks found:", [...new Set(agents.map(a => a.rank))]);
    }, [agents]);

    // Helper Functions
    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedNodes(newExpanded);
    };

    const handleEditManager = (agent: Agent) => {
        setEditingAgent(agent);
        setNewManagerCode(agent.manager_code || "");
    };

    const saveManagerChange = async () => {
        if (!editingAgent) return;
        try {
            const res = await fetch(`/api/agents/${editingAgent.agent_code}`, {
                method: "PUT",
                body: JSON.stringify({ manager_code: newManagerCode }),
                headers: { "Content-Type": "application/json" }
            });
            const result = await res.json();
            if (result.success) {
                toast({ title: "Thành công", description: "Đã cập nhật cấu trúc" });
                setEditingAgent(null);
                onUpdate();
            } else {
                toast({ title: "Lỗi", description: result.error, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Lỗi", description: "Không thể cập nhật", variant: "destructive" });
        }
    };

    const handleDownloadTree = async () => {
        if (!treeContainerRef.current) return;
        try {
            // Enforce a decent width for capture to prevent mobile layout issues
            const targetWidth = Math.max(1200, treeContainerRef.current.scrollWidth);
            const targetHeight = treeContainerRef.current.scrollHeight;

            const dataUrl = await toPng(treeContainerRef.current, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                pixelRatio: 2,
                width: targetWidth,
                height: targetHeight,
                style: {
                    transform: 'scale(1)',
                    width: `${targetWidth}px`,
                    minWidth: `${targetWidth}px`,
                }
            });
            const link = document.createElement('a');
            link.download = 'so-do-to-chuc.png';
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Failed to download tree", err);
            toast({ title: "Lỗi", description: "Không thể tải ảnh sơ đồ", variant: "destructive" });
        }
    };

    const availableManagers = useMemo(() => {
        if (!editingAgent) return [];
        return agents.filter(a => a.agent_code !== editingAgent.agent_code);
    }, [agents, editingAgent]);

    // Render Node (List View)
    const renderNode = (node: TreeNode) => {
        const isVirtualRoot = node.agent.agent_code === 'root';
        const isSMGroup = (node.agent.rank as string) === 'TEAM';
        const isExpanded = expandedNodes.has(node.agent.agent_code);
        const hasChildren = node.children.length > 0;

        const nodeMatches = isVirtualRoot ? true : (
            node.agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.agent.agent_code.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Helper to check if any children match (recursive)
        const childMatches = (n: TreeNode): boolean => {
            if (n.children.length === 0) return false;
            return n.children.some(c => {
                const match = c.agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.agent.agent_code.toLowerCase().includes(searchTerm.toLowerCase());
                return match || childMatches(c);
            });
        };

        // Filter out Terminated/Hold agents from List View (but keep SM rank)
        const statusStr = (node.agent.status as string || '').toLowerCase();
        const isSMRank = (node.agent.rank as string)?.trim().toUpperCase() === 'SM';
        if (!isSMRank && !isSMGroup && (statusStr.includes('ter') || statusStr === 'terminated' || statusStr === 'hold')) {
            return null;
        }

        const shouldShow = !searchTerm || nodeMatches || childMatches(node);

        if (!shouldShow) return null;

        const effectiveExpanded = searchTerm ? true : isExpanded;

        return (
            <div key={node.agent.agent_code}>
                <div className={`flex items-center hover:bg-slate-50 py-2 border-b border-slate-50 ${isVirtualRoot ? "bg-slate-50/50" : ""} ${isSMGroup ? "bg-orange-50/30" : ""}`}>
                    {/* Name Column */}
                    <div className="flex-1 flex items-center min-w-0 pr-4">
                        <div style={{ width: `${(isVirtualRoot ? 0 : node.level) * 24 + (isVirtualRoot ? 4 : 12)}px` }} className="shrink-0" />
                        <div className="w-6 h-6 shrink-0 flex items-center justify-center mr-1">
                            {hasChildren ? (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpand(node.agent.agent_code)}>
                                    {effectiveExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                </Button>
                            ) : null}
                        </div>
                        <div className="flex items-center gap-2 truncate">
                            {isVirtualRoot ? (
                                isEditingRoot ? (
                                    <Input
                                        value={rootName}
                                        onChange={(e) => setRootName(e.target.value)}
                                        className="h-7 w-[200px] text-sm font-bold"
                                        autoFocus
                                        onBlur={() => setIsEditingRoot(false)}
                                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingRoot(false)}
                                    />
                                ) : (
                                    <span
                                        className="font-bold text-lg text-slate-800 cursor-pointer hover:underline decoration-dashed underline-offset-4 truncate"
                                        onClick={() => setIsEditingRoot(true)}
                                        title="Nhấn để đổi tên"
                                    >
                                        {rootName}
                                    </span>
                                )
                            ) : (
                                <span className={`font-medium text-sm truncate ${nodeMatches && searchTerm ? "bg-yellow-100 text-yellow-900 px-1 rounded" : ""} ${isSMGroup ? "text-orange-800 italic" : "text-slate-900"}`}>
                                    {node.agent.full_name}
                                </span>
                            )}
                            {!effectiveExpanded && hasChildren && !isVirtualRoot && !isSMGroup && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full flex items-center shrink-0">
                                    <Users className="w-3 h-3 mr-1" /> {node.children.length}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Columns */}
                    <div className="w-[100px] text-center text-sm font-mono text-slate-500 shrink-0">
                        {isVirtualRoot || isSMGroup ? "" : node.agent.agent_code}
                    </div>
                    <div className="w-[100px] flex justify-center shrink-0">
                        {isVirtualRoot ? (
                            <span className="h-5 w-[50px]"></span>
                        ) : (
                            <Badge variant="outline" className={`font-mono text-[10px] h-5 justify-center w-[50px] ${node.agent.status === 'Terminated' ? 'bg-slate-100 text-slate-500' : isSMGroup ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700'}`}>
                                {isSMGroup ? 'GROUP' : node.agent.rank}
                            </Badge>
                        )}
                    </div>
                    <div className="w-[100px] text-center text-sm font-medium text-slate-700 shrink-0">
                        {isVirtualRoot || isSMGroup ? <span className="text-slate-300">-</span> : node.directAgents}
                    </div>
                    <div className="w-[100px] text-center text-sm font-bold text-blue-700 shrink-0">
                        {node.totalBranchAgents}
                    </div>
                    <div className="w-[80px] flex justify-center gap-1 shrink-0">
                        {onAddSubordinate && !isSMGroup && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50 ${isVirtualRoot ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                onClick={(e) => { e.stopPropagation(); onAddSubordinate(isVirtualRoot ? null : node.agent); }}
                                title="Thêm cấp dưới"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        )}
                        {!isVirtualRoot && !isSMGroup && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100"
                                onClick={() => handleEditManager(node.agent)}
                                title="Điều chuyển"
                            >
                                <MoveRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
                {hasChildren && effectiveExpanded && (
                    <div>
                        {node.children.map(renderNode)}
                    </div>
                )}
            </div>
        );
    };

    // Render Org Chart Node (Tree View)
    const renderOrgChartNode = (node: TreeNode) => {
        const isVirtualRoot = node.agent.agent_code === 'root';
        const isSMGroup = (node.agent.rank as string) === 'TEAM';
        const hasChildren = node.children.length > 0;

        const isMatch = searchTerm && (
            node.agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.agent.agent_code.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div key={node.agent.agent_code} className="flex flex-col items-center">
                <div className={`
                    relative flex flex-col items-center p-3 rounded-lg border shadow-sm w-[180px] transition-all
                    ${isMatch ? "bg-yellow-50 border-yellow-400 ring-2 ring-yellow-400" :
                        isSMGroup ? "bg-orange-50 border-orange-200 border-dashed" :
                            "bg-white border-slate-200 hover:shadow-md hover:border-blue-300"}
                    ${isVirtualRoot ? "bg-slate-100 border-dashed" : ""}
                `}>
                    <div className="text-center">
                        <div className={`font-bold text-sm truncate w-full ${isSMGroup ? "text-orange-700" : "text-slate-800"}`} title={node.agent.full_name}>
                            {node.agent.full_name}
                        </div>
                        {!isVirtualRoot && !isSMGroup && (
                            <div className="text-xs text-slate-500 font-mono mt-1">
                                {node.agent.agent_code}
                            </div>
                        )}
                        <div className="mt-2 flex items-center justify-center gap-2">
                            {!isSMGroup && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-slate-100 text-slate-600">
                                    {node.agent.rank}
                                </Badge>
                            )}
                            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isSMGroup ? "text-orange-700 bg-orange-100" : "text-blue-600 bg-blue-50"}`} title="Tổng nhân sự nhánh">
                                {isSMGroup ? `Tổng: ${node.totalBranchAgents}` : node.totalBranchAgents}
                            </div>
                        </div>
                    </div>
                    {onAddSubordinate && !isSMGroup && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white border shadow-sm text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); onAddSubordinate(isVirtualRoot ? null : node.agent); }}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    )}
                </div>
                {hasChildren && (
                    <div className="flex flex-col items-center">
                        <div className={`h-4 w-px ${isSMGroup ? "bg-orange-300" : "bg-slate-300"}`}></div>
                    </div>
                )}
                {hasChildren && (
                    <div className={`flex gap-4 pt-4 border-t relative ${isSMGroup ? "border-orange-300" : "border-slate-300"}`}>
                        {node.children.map(child => (
                            <div key={child.agent.agent_code} className="relative">
                                <div className={`absolute left-1/2 -top-4 h-4 w-px -translate-x-1/2 ${isSMGroup ? "bg-orange-300" : "bg-slate-300"}`}></div>
                                {renderOrgChartNode(child)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Calculate Headcount
    // Exclude Terminated, Hold agents, and SM rank
    const headCount = agents.filter(a => {
        const s = (a.status as string || '').toLowerCase();
        const r = (a.rank as string || '').toUpperCase();
        return !s.includes('ter') && s !== 'hold' && r !== 'SM';
    }).length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex p-1 bg-slate-100 rounded-lg">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-3 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setViewMode('list')}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span className="text-xs font-semibold">Danh sách</span>
                            </div>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-3 rounded-md ${viewMode === 'tree' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setViewMode('tree')}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold">Sơ đồ cây</span>
                            </div>
                        </Button>
                    </div>

                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Tìm kiếm nhân sự..."
                            className="pl-8 h-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-500">
                        Sĩ số: <strong>{headCount}</strong>
                    </div>
                    {viewMode === 'tree' && (
                        <Button variant="outline" size="sm" onClick={handleDownloadTree} className="gap-2">
                            <span className="text-xs">Tải sơ đồ</span>
                        </Button>
                    )}
                </div>
            </div>

            <Card className="min-h-[500px] overflow-auto border-dashed shadow-sm bg-slate-50/30">
                {viewMode === 'list' ? (
                    <>
                        <div className="flex items-center py-3 px-4 bg-slate-100 border-b text-xs font-bold text-slate-700 uppercase tracking-wider">
                            <div className="flex-1 pl-8">Họ và tên</div>
                            <div className="w-[100px] text-center">Mã số</div>
                            <div className="w-[100px] text-center">Chức danh</div>
                            <div className="w-[100px] text-center">ĐL Trực tiếp</div>
                            <div className="w-[100px] text-center">Toàn nhánh</div>
                            <div className="w-[80px] text-center">Thao tác</div>
                        </div>

                        <CardContent className="p-0">
                            {treeData.length > 0 ? (
                                <div className="py-2 bg-white">
                                    {treeData.map(renderNode)}
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 py-10">
                                    Chưa có dữ liệu nhân sự.
                                </div>
                            )}
                        </CardContent>
                    </>
                ) : (
                    <CardContent className="p-10 overflow-auto cursor-grab active:cursor-grabbing" style={{ minWidth: '100%', minHeight: '600px' }}>
                        <div ref={treeContainerRef} className="inline-block min-w-full p-4 bg-slate-50/30 w-fit">
                            <div className="flex justify-center w-full">
                                <div className="flex gap-8">
                                    {treeData.map(root => renderOrgChartNode(root))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            <Dialog open={!!editingAgent} onOpenChange={(open) => !open && setEditingAgent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Điều chuyển nhân sự</DialogTitle>
                        <DialogDescription>
                            Thay đổi người quản lý trực tiếp cho <strong>{editingAgent?.full_name} ({editingAgent?.agent_code})</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Người quản lý mới</Label>
                            <Select value={newManagerCode} onValueChange={setNewManagerCode}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn quản lý mới" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    <SelectItem value="______">-- Không có quản lý (Root) --</SelectItem>
                                    {availableManagers.slice(0, 500).map(m => (
                                        <SelectItem key={m.agent_code} value={m.agent_code}>
                                            [{m.rank}] {m.full_name} ({m.agent_code})
                                        </SelectItem>
                                    ))}
                                    {availableManagers.length > 500 && (
                                        <div className="px-2 py-2 text-xs text-slate-500 text-center">...và {availableManagers.length - 500} người khác (dùng tìm kiếm để lọc)</div>
                                    )}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-slate-500">
                                * Lưu ý: Việc thay đổi này sẽ di chuyển toàn bộ nhánh con của nhân sự này sang nhánh mới.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingAgent(null)}>Hủy</Button>
                        <Button onClick={saveManagerChange}>Xác nhận điều chuyển</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
