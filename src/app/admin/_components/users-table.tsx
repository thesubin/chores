"use client";

import { type User } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { DataTable } from "~/components/ui/data-table";

interface UsersTableProps {
  data: string;
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
              <span className="text-sm font-medium text-gray-700">
                {user.name?.[0]?.toUpperCase() ??
                  user.email?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.name ?? "No Name"}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role: string = row.getValue("role");
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            role === "ADMIN"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {role}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: () => (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        Active
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      return new Date(row.getValue("createdAt")).toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center justify-end space-x-2">
          <Link
            href={`/admin/users/${user.id}/edit`}
            className="text-blue-600 hover:text-blue-900"
          >
            <PencilIcon className="h-4 w-4" />
          </Link>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this user?")) {
                // Handle delete
              }
            }}
            className="text-red-600 hover:text-red-900"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      );
    },
  },
];

export function UsersTable({ data }: UsersTableProps) {
  const parsedData = JSON.parse(data) as User[];
  return <DataTable columns={columns} data={parsedData} searchKey="name" />;
}
