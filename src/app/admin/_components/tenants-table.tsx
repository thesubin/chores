"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { type ColumnDef } from "@tanstack/react-table";
import { PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { DataTable } from "~/components/ui/data-table";
import { api } from "~/trpc/react";

// Define the Tenant type
interface Tenant {
  id: string;
  userId: string;
  propertyId: string;
  roomId: string | null;
  monthlyRent: number;
  rentDueDay: number;
  depositAmount: number | null;
  securityDeposit: number | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  moveInDate: string | null;
  leaseStartDate: string | null;
  leaseEndDate: string | null;
  remarks: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  };
  property: {
    id: string;
    name: string;
  };
  room: {
    id: string;
    name: string;
  } | null;
}

interface TenantsTableProps {
  data: string;
  propertyId?: string;
}

export function TenantsTable({ data, propertyId }: TenantsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Parse data from string (due to serialization)
  const parsedData = JSON.parse(data) as Tenant[];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Delete tenant mutation
  const deleteTenant = api.tenant.delete.useMutation({
    onSuccess: () => {
      toast.success("Tenant profile deleted successfully");
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
      `Are you sure you want to delete ${name}'s tenant profile? This action cannot be undone.`,
    );

    if (confirmed) {
      setDeletingId(id);
      try {
        await deleteTenant.mutateAsync({ id });
      } catch (error) {
        // Error is handled in the mutation callbacks
        console.error("Delete error:", error);
      }
    }
  };

  const columns: ColumnDef<Tenant>[] = [
    {
      accessorKey: "user",
      header: "Tenant",
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {tenant.user.name ?? "No Name"}
            </div>
            <div className="text-sm text-gray-500">{tenant.user.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "property",
      header: "Property",
      cell: ({ row }) => {
        const tenant = row.original;
        if (!propertyId) {
          return (
            <div>
              <div className="text-sm font-medium text-gray-900">
                <Link
                  href={`/admin/properties/${tenant.propertyId}`}
                  className="hover:text-blue-600"
                >
                  {tenant.property.name}
                </Link>
              </div>
              <div className="text-sm text-gray-500">
                {tenant.room?.name ?? "No room"}
              </div>
            </div>
          );
        }
        return (
          <div className="text-sm text-gray-900">
            {tenant.room?.name ?? "No room"}
          </div>
        );
      },
    },
    {
      accessorKey: "monthlyRent",
      header: "Monthly Rent",
      cell: ({ row }) => {
        const amount: number = row.getValue("monthlyRent");
        return (
          <div className="text-sm text-gray-900">{formatCurrency(amount)}</div>
        );
      },
    },
    {
      accessorKey: "leaseEndDate",
      header: "Lease End",
      cell: ({ row }) => {
        const date = row.original.leaseEndDate;
        return (
          <div className="text-sm text-gray-900">
            {date ? new Date(date).toLocaleDateString() : "N/A"}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex items-center justify-end space-x-2">
            <Link
              href={`/admin/tenants/${tenant.id}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <EyeIcon className="h-4 w-4" />
            </Link>
            <Link
              href={`/admin/tenants/${tenant.id}/edit`}
              className="text-blue-600 hover:text-blue-900"
            >
              <PencilIcon className="h-4 w-4" />
            </Link>
            <button
              onClick={() =>
                handleDelete(
                  tenant.id,
                  tenant.user.name ?? tenant.user.email ?? "this tenant",
                )
              }
              disabled={deletingId === tenant.id}
              className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={parsedData} searchKey="user" />;
}
