"use client";

import { useState } from "react";
import { type User } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import { PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { DataTable } from "~/components/ui/data-table";
import { api } from "~/trpc/react";

interface UsersTableProps {
  data: User[];
}

export function UsersTable({ data }: UsersTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Delete user mutation
  const deleteUser = api.auth.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      setDeletingId(null);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setDeletingId(null);
    },
  });

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}? This action cannot be undone.`,
    );

    if (confirmed) {
      setDeletingId(id);
      try {
        await deleteUser.mutateAsync({ id });
      } catch (error) {
        // Error is handled in the mutation callbacks
        console.error("Delete error:", error);
      }
    }
  };

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
                  {user.name?.[0]?.toUpperCase() ||
                    user.email?.[0]?.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {user.name || "No Name"}
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
        const role = row.getValue("role") as string;
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
              href={`/admin/users/${user.id}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <EyeIcon className="h-4 w-4" />
            </Link>
            <Link
              href={`/admin/users/${user.id}/edit`}
              className="text-blue-600 hover:text-blue-900"
            >
              <PencilIcon className="h-4 w-4" />
            </Link>
            <button
              onClick={() =>
                handleDelete(user.id, user.name || user.email || "this user")
              }
              disabled={deletingId === user.id}
              className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={data} searchKey="name" />;
}
