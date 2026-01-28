
"use client";

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export type Contract = {
    policy_number: string;
    agent_code: string;
    customer_name: string;
    product_code: string;
    submit_date: string;
    issue_date: string | null;
    fyp: number;
    ape: number;
    status: string;
    agents: {
        full_name: string;
        rank: string;
        manager_code: string;
        manager_name: string; // From join
    } | null;
};

interface ContractsTableProps {
    data: Contract[];
}

export function ContractsTable({ data }: ContractsTableProps) {
    const columns: ColumnDef<Contract>[] = [
        {
            id: "stt",
            header: "STT",
            cell: ({ row }) => row.index + 1,
        },
        {
            accessorKey: "policy_number",
            header: "Số HĐ",
        },
        {
            accessorKey: "submit_date",
            header: "Ngày nộp",
            cell: ({ row }) => {
                const date = row.getValue("submit_date") as string;
                if (!date) return "";
                return new Date(date).toLocaleDateString("vi-VN");
            }
        },
        {
            accessorKey: "agent_code",
            header: "MSĐL",
        },
        {
            id: "agent_name",
            header: "Họ tên Đại lý",
            accessorFn: (row) => row.agents?.full_name || "",
        },
        {
            id: "rank",
            header: "Rank",
            accessorFn: (row) => row.agents?.rank || "",
        },
        {
            id: "manager_code",
            header: "MSQL",
            accessorFn: (row) => row.agents?.manager_code || "",
        },
        {
            id: "manager_name",
            header: "Quản lý",
            accessorFn: (row) => row.agents?.manager_name || "",
        },
        {
            accessorKey: "customer_name",
            header: "Khách hàng", // Added for context
        },
        {
            accessorKey: "product_code",
            header: "Sản phẩm",
        },
        {
            accessorKey: "fyp",
            header: "Phí BH",
            cell: ({ row }) => {
                const val = parseFloat(row.getValue("fyp"));
                return new Intl.NumberFormat('vi-VN').format(val);
            }
        },
        {
            accessorKey: "ape",
            header: "APE",
            cell: ({ row }) => {
                const val = parseFloat(row.getValue("ape"));
                return new Intl.NumberFormat('vi-VN').format(val);
            }
        },
        {
            accessorKey: "issue_date",
            header: "Ngày cấp",
            cell: ({ row }) => {
                const date = row.getValue("issue_date") as string;
                if (!date) return "";
                return new Date(date).toLocaleDateString("vi-VN");
            }
        },
        {
            accessorKey: "status",
            header: "Trạng thái",
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 20,
            }
        }
    });

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={
                                        row.original.status === 'Issued' ? "text-green-600 font-medium" :
                                            row.original.status === 'Cancelled' ? "text-red-600 font-medium" :
                                                row.original.status === 'Pending' ? "text-orange-600 font-medium" :
                                                    undefined
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    Không có dữ liệu.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Trước
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Sau
                </Button>
            </div>
        </div>
    );
}
