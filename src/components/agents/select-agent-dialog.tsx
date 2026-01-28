"use client";

import { useEffect, useState, useMemo } from "react";
import { Agent } from "@/types/database";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SelectAgentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    manager: Agent | null; // The manager we are adding TO
    candidates: Agent[]; // List of available agents
    onSuccess: () => void;
}

export function SelectAgentDialog({ open, onOpenChange, manager, candidates, onSuccess }: SelectAgentDialogProps) {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRank, setSelectedRank] = useState("ALL");
    const [selectedCandidate, setSelectedCandidate] = useState<Agent | null>(null);

    const filteredCandidates = useMemo(() => {
        return candidates.filter(c => {
            const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.agent_code.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRank = selectedRank === 'ALL' || c.rank === selectedRank;

            return matchesSearch && matchesRank;
        });
    }, [candidates, searchTerm, selectedRank]);

    const handleSelect = async (candidate: Agent) => {
        try {
            // Update the candidate's manager_code to the selected manager's code
            // If manager is null (Virtual Root), what is the code?
            // The virtual root usually implies "Top Level". In DB, this might mean manager_code is NULL/Empty.
            // However, the user request is "Select existing manager". If we add to Root, we are essentially "Unassigning" or "Setting to Top".
            // Let's assume hitting (+) on Root means setting their manager to NULL/Empty (becoming a root themselves).

            const newManagerCode = manager ? manager.agent_code : "";

            const res = await fetch(`/api/agents/${candidate.agent_code}`, {
                method: "PUT",
                body: JSON.stringify({ manager_code: newManagerCode }),
                headers: { "Content-Type": "application/json" }
            });
            const result = await res.json();

            if (result.success) {
                toast({ title: "Thành công", description: `Đã thêm ${candidate.full_name} vào nhóm` });
                onOpenChange(false);
                onSuccess();
            } else {
                toast({ title: "Lỗi", description: result.error, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Lỗi", description: "Không thể cập nhật", variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Chọn nhân sự</DialogTitle>
                    <DialogDescription>
                        Thêm vào nhóm của: <strong>{manager ? manager.full_name : "Giám đốc Kinh doanh"}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 mb-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Tìm kiếm theo tên hoặc mã..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    {/* Rank Filters */}
                    <div className="flex flex-wrap gap-1">
                        {['ALL', 'UM', 'SUM', 'DM', 'SDM', 'BM', 'AM', 'SM', 'Ter'].map((rank) => (
                            <Badge
                                key={rank}
                                variant={selectedRank === rank ? "default" : "outline"}
                                className={`cursor-pointer hover:bg-slate-100 ${selectedRank === rank ? "bg-blue-600 hover:bg-blue-700 text-white" : "text-slate-600 bg-white"}`}
                                onClick={() => setSelectedRank(rank)}
                            >
                                {rank === 'ALL' ? 'Tất cả' : rank}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-hidden border rounded-md">
                    <ScrollArea className="h-full p-2">
                        <div className="space-y-1">
                            {filteredCandidates.length > 0 ? filteredCandidates.map(candidate => (
                                <div
                                    key={candidate.agent_code}
                                    className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer"
                                    onClick={() => handleSelect(candidate)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{candidate.full_name}</span>
                                            <span className="text-xs text-slate-400">{candidate.agent_code}</span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] bg-white">{candidate.rank}</Badge>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    Không tìm thấy nhân sự phù hợp
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="mt-2 text-xs text-slate-400 text-center sm:justify-center">
                    Chọn một nhân sự để thêm ngay vào nhóm
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
