"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { toast } from "react-hot-toast";
import { api } from "~/trpc/react";

type Report = {
  id: string;
  title: string;
  type: "TASKS" | "PAYMENTS" | "TENANTS" | "CUSTOM";
  isActive: boolean;
  createdAt: string | Date;
};

export function ReportsTable() {
  const utils = api.useUtils();
  const { data, isLoading } = api.report.getAll.useQuery();
  const deleteMutation = api.report.delete.useMutation({
    onSuccess: async () => {
      await utils.report.getAll.invalidate();
      toast.success("Report deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const columns = useMemo<ColumnDef<Report>[]>(
    () => [
      { accessorKey: "title", header: "Title" },
      { accessorKey: "type", header: "Type" },
      {
        accessorKey: "isActive",
        header: "Active",
        cell: ({ getValue }) => (getValue<boolean>() ? "Yes" : "No"),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ getValue }) =>
          new Date(getValue<string | Date>()).toLocaleString("en-CA", {
            timeZone: "America/Toronto",
          }),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Link
              className="text-blue-600 hover:underline"
              href={`/admin/reports/${row.original.id}`}
            >
              View
            </Link>
            <Link
              className="text-indigo-600 hover:underline"
              href={`/admin/reports/${row.original.id}/edit`}
            >
              Edit
            </Link>
            <button
              className="text-red-600 hover:underline"
              onClick={() => deleteMutation.mutate(row.original.id)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [deleteMutation],
  );

  const table = useReactTable({
    data: (data ?? []) as Report[],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <div>Loading reports…</div>;

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">Reports</h2>
        <Link
          className="rounded bg-blue-600 px-3 py-2 text-white"
          href="/admin/reports/new"
        >
          New Report
        </Link>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
