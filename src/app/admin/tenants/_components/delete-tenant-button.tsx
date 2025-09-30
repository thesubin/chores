"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

import { api } from "~/trpc/react";

interface DeleteTenantButtonProps {
  tenantId: string;
  tenantName: string;
}

export function DeleteTenantButton({
  tenantId,
  tenantName,
}: DeleteTenantButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteTenant = api.tenant.delete.useMutation({
    onSuccess: () => {
      toast.success("Tenant profile deleted successfully");
      router.push("/admin/tenants");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsDeleting(false);
    },
  });

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${tenantName}'s tenant profile? This action cannot be undone. This will only remove the tenant profile, not the user account.`,
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        await deleteTenant.mutateAsync({ id: tenantId });
      } catch (error) {
        // Error is handled in the mutation callbacks
        console.error("Delete error:", error);
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
    >
      <TrashIcon className="mr-2 h-4 w-4" />
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
