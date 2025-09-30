import { notFound } from "next/navigation";
import Link from "next/link";
import { PlusIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Suspense } from "react";

import { api } from "~/trpc/server";
import { RoomsTable } from "../../../_components/rooms-table";
import { RoomsTableSkeleton } from "../../../_components/rooms-table-skeleton";

interface PropertyRoomsPageProps {
  params: {
    id: string;
  };
}

export default async function PropertyRoomsPage({
  params,
}: PropertyRoomsPageProps) {
  // Fetch property data
  let property;
  try {
    property = await api.property.getById({ id: params.id });
  } catch (error) {
    notFound();
  }

  // Fetch rooms for this property
  const rooms = await api.room.getByProperty({ propertyId: params.id });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center">
            <Link
              href={`/admin/properties/${params.id}`}
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Rooms - {property?.name ?? "Property"}
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Manage rooms for this property, assign tenants, and track tasks.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href={`/admin/rooms/new?propertyId=${params.id}`}
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
            <RoomsTable data={JSON.stringify(rooms)} propertyId={params.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
