"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { type ColumnDef } from "@tanstack/react-table";
import { PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { DataTable } from "~/components/ui/data-table";
import { api } from "~/trpc/react";

// Define the Room type with counts
interface Room {
  id: string;
  name: string;
  propertyId: string;
  description: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  property: {
    id: string;
    name: string;
  };
  _count?: {
    tenants?: number;
    tasks?: number;
  };
}

interface RoomsTableProps {
  data: string;
  propertyId?: string;
}

export function RoomsTable({ data, propertyId }: RoomsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Parse data from string (due to serialization)
  const parsedData = JSON.parse(data) as Room[];

  // Delete room mutation
  const deleteRoom = api.room.delete.useMutation({
    onSuccess: () => {
      toast.success("Room deleted successfully");
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
      `Are you sure you want to delete ${name}? This action cannot be undone and will remove all tenant assignments for this room.`,
    );

    if (confirmed) {
      setDeletingId(id);
      try {
        await deleteRoom.mutateAsync({ id });
      } catch (error) {
        // Error is handled in the mutation callbacks
        console.error("Delete error:", error);
      }
    }
  };

  const columns: ColumnDef<Room>[] = [
    {
      accessorKey: "name",
      header: "Room",
      cell: ({ row }) => {
        const room = row.original;
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">{room.name}</div>
            {!propertyId && (
              <div className="text-sm text-gray-500">
                <Link
                  href={`/admin/properties/${room.propertyId}`}
                  className="hover:text-blue-600"
                >
                  {room.property.name}
                </Link>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null;
        return (
          <div className="max-w-xs truncate text-sm text-gray-500">
            {description || "No description"}
          </div>
        );
      },
    },
    {
      accessorKey: "stats",
      header: "Stats",
      cell: ({ row }) => {
        const room = row.original;
        return (
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <span className="mr-1">👥</span>
              {room._count?.tenants ?? 0} tenants
            </span>
            <span className="flex items-center">
              <span className="mr-1">📋</span>
              {room._count?.tasks ?? 0} tasks
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const room = row.original;
        return (
          <div className="flex items-center justify-end space-x-2">
            <Link
              href={`/admin/rooms/${room.id}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <EyeIcon className="h-4 w-4" />
            </Link>
            <Link
              href={`/admin/rooms/${room.id}/edit`}
              className="text-blue-600 hover:text-blue-900"
            >
              <PencilIcon className="h-4 w-4" />
            </Link>
            <button
              onClick={() => handleDelete(room.id, room.name)}
              disabled={deletingId === room.id}
              className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={parsedData} searchKey="name" />;
}
