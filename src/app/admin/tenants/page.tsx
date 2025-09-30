import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Suspense } from "react";

import { api } from "~/trpc/server";
import { MobileTenantsTable } from "../_components/mobile-tenants-table";
import { TenantsTableSkeleton } from "../_components/tenants-table-skeleton";

export default async function TenantsPage() {
  const tenants = await api.tenant.getAll();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-0">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Tenants
          </h1>
          <p className="mt-1 text-sm text-gray-700 sm:mt-2">
            Manage tenant profiles, view lease details, and track payments.
          </p>
        </div>
        <div className="sm:ml-16 sm:flex-none">
          <Link
            href="/admin/tenants/new"
            className="block w-full rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
          >
            <PlusIcon className="mr-2 inline h-4 w-4" />
            Add Tenant
          </Link>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-2 py-4 sm:px-4 sm:py-5 lg:px-6">
          <Suspense fallback={<TenantsTableSkeleton />}>
            <MobileTenantsTable data={JSON.stringify(tenants)} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
