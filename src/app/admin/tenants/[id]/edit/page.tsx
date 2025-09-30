import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

import { api } from "~/trpc/server";
import { TenantForm } from "../../_components/tenant-form";

interface EditTenantPageProps {
  params: {
    id: string;
  };
}

export default async function EditTenantPage({ params }: EditTenantPageProps) {
  // Fetch tenant data
  const tenant = await api.tenant.getById({ id: params.id }).catch(() => {
    notFound();
    // This return is just to satisfy TypeScript, notFound() throws an error
    return null;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center">
            <Link
              href={`/admin/tenants/${params.id}`}
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Tenant</h1>
              <p className="mt-2 text-sm text-gray-700">
                Update tenant profile information and lease details.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <TenantForm initialData={tenant} isEditing />
        </div>
      </div>
    </div>
  );
}
