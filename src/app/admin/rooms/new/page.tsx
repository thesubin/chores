import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

import { RoomForm } from "../_components/room-form";

interface NewRoomPageProps {
  searchParams: Promise<{ propertyId?: string }>;
}

export default async function NewRoomPage({ searchParams }: NewRoomPageProps) {
  const { propertyId } = await searchParams;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center">
            <Link
              href={
                propertyId ? `/admin/properties/${propertyId}` : "/admin/rooms"
              }
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Room</h1>
              <p className="mt-2 text-sm text-gray-700">
                Create a new room within a property.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <RoomForm propertyId={propertyId} />
        </div>
      </div>
    </div>
  );
}
