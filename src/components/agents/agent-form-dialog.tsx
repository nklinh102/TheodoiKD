"use client";

import { useEffect, useState } from "react";
import { Agent, AgentStatus, Rank } from "@/types/database";
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
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ChevronsUpDown, Check } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface AgentFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Agent | null;
    defaultManagerCode?: string; // Pre-fill manager code
    onSuccess: () => void;
    agents?: Agent[]; // List of all agents for manager selection
}

export function AgentFormDialog({ open, onOpenChange, initialData, defaultManagerCode, onSuccess, agents = [] }: AgentFormDialogProps) {
    const { toast } = useToast();
    const [formData, setFormData] = useState<Partial<Agent>>({});
    const isEdit = !!initialData;
    const [openManagerSelect, setOpenManagerSelect] = useState(false);

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({ ...initialData });
            } else {
                setFormData({
                    rank: 'FA',
                    status: 'Active',
                    join_date: new Date().toISOString().split('T')[0],
                    manager_code: defaultManagerCode || ""
                });
            }
        }
    }, [open, initialData, defaultManagerCode]);

    const handleSubmit = async () => {
        try {
            const url = isEdit ? `/api/agents/${initialData.agent_code}` : "/api/agents";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                body: JSON.stringify(formData),
                headers: { "Content-Type": "application/json" }
            });
            const result = await res.json();

            if (result.success) {
                toast({ title: "Thành công", description: isEdit ? "Đã cập nhật đại lý" : "Đã thêm đại lý mới" });
                onOpenChange(false);
                onSuccess();
            } else {
                toast({ title: "Lỗi", description: result.error, variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Lỗi", description: "Có lỗi xảy ra", variant: "destructive" });
        }
    };

    const selectedManager = agents.find(a => a.agent_code === formData.manager_code);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Cập nhật thông tin" : "Thêm Đại lý mới"}</DialogTitle>
                    <DialogDescription>Nhập thông tin chi tiết bên dưới.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Mã số</Label>
                            <Input
                                value={formData.agent_code || ""}
                                onChange={e => setFormData({ ...formData, agent_code: e.target.value })}
                                disabled={isEdit}
                                placeholder="VD: AG001"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Họ tên</Label>
                            <Input
                                value={formData.full_name || ""}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="Nguyễn Văn A"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Cấp bậc</Label>
                            <Select value={formData.rank} onValueChange={(v: Rank) => {
                                let newStatus: AgentStatus = formData.status || 'Active';
                                if (['FA', 'UM', 'SUM', 'DM', 'SDM', 'BM', 'AM'].includes(v)) {
                                    newStatus = 'Active';
                                } else if (v === 'Ter') {
                                    newStatus = 'Terminated';
                                } else if (['SA', 'SM'].includes(v)) {
                                    newStatus = 'Hold';
                                }
                                setFormData({ ...formData, rank: v, status: newStatus });
                            }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FA">FA</SelectItem>
                                    <SelectItem value="UM">UM</SelectItem>
                                    <SelectItem value="SUM">SUM</SelectItem>
                                    <SelectItem value="DM">DM</SelectItem>
                                    <SelectItem value="SDM">SDM</SelectItem>
                                    <SelectItem value="BM">BM</SelectItem>
                                    <SelectItem value="AM">AM</SelectItem>
                                    <SelectItem value="SA">SA</SelectItem>
                                    <SelectItem value="SM">SM</SelectItem>
                                    <SelectItem value="Ter">Ter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Trạng thái</Label>
                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as AgentStatus })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Terminated">Terminated</SelectItem>
                                    <SelectItem value="Hold">Hold</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Ngày gia nhập</Label>
                            <Input type="date" value={formData.join_date || ""} onChange={e => setFormData({ ...formData, join_date: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Điện thoại</Label>
                            <Input value={formData.phone || ""} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2 flex flex-col">
                            <Label>Người Quản lý (Chọn từ danh sách)</Label>
                            <Popover open={openManagerSelect} onOpenChange={setOpenManagerSelect}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openManagerSelect}
                                        className="justify-between"
                                    >
                                        {formData.manager_code
                                            ? (selectedManager ? `[${selectedManager.rank}] ${selectedManager.full_name} (${selectedManager.agent_code})` : formData.manager_code)
                                            : "Chọn người quản lý..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Tìm quản lý..." />
                                        <CommandList>
                                            <CommandEmpty>Không tìm thấy.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="______"
                                                    onSelect={() => {
                                                        setFormData({ ...formData, manager_code: "", manager_name: "" });
                                                        setOpenManagerSelect(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            !formData.manager_code ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    -- Không có quản lý (Root) --
                                                </CommandItem>
                                                {agents
                                                    .filter(agent => ['UM', 'SUM', 'DM', 'SDM', 'BM', 'AM', 'SM'].includes(agent.rank))
                                                    .map((agent) => (
                                                        <CommandItem
                                                            key={agent.agent_code}
                                                            value={agent.agent_code + " " + agent.full_name} // Search by both code and name
                                                            onSelect={() => {
                                                                setFormData({ ...formData, manager_code: agent.agent_code, manager_name: agent.full_name });
                                                                setOpenManagerSelect(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.manager_code === agent.agent_code ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            [{agent.rank}] {agent.full_name} ({agent.agent_code})
                                                        </CommandItem>
                                                    ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {/* Hidden Input purely for fallback editing or viewing raw code */}
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-500 whitespace-nowrap">Mã quản lý:</span>
                                <Input
                                    className="h-6 text-xs w-[100px]"
                                    value={formData.manager_code || ""}
                                    onChange={e => setFormData({ ...formData, manager_code: e.target.value })}
                                    placeholder="Nhập mã..."
                                />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Mã tổ</Label>
                            <Input
                                value={formData.group_code || ""}
                                onChange={e => setFormData({ ...formData, group_code: e.target.value })}
                                placeholder="Mã tổ"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mã Tuyển dụng</Label>
                            <Input value={formData.recruiter_code || ""} onChange={e => setFormData({ ...formData, recruiter_code: e.target.value })} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                    <Button onClick={handleSubmit}>Lưu thay đổi</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
