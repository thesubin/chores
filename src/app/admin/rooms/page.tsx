import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Suspense } from "react";

import { api } from "~/trpc/server";
import { RoomsTable } from "../_components/rooms-table";
import { RoomsTableSkeleton } from "../_components/rooms-table-skeleton";

export default async function RoomsPage() {
  const rooms = await api.room.getAll();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage rooms across all properties, assign tenants, and track tasks.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/admin/rooms/new"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="mr-2 inline h-4 w-4" />
            Add Room
          </Link>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <Suspense fallback={<RoomsTableSkeleton />}>
            <RoomsTable data={JSON.stringify(rooms)} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
