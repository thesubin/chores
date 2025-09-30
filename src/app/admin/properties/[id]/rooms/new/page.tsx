import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

import { api } from "~/trpc/server";
import { RoomForm } from "../../../../rooms/_components/room-form";

interface NewPropertyRoomPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NewPropertyRoomPage({
  params,
}: NewPropertyRoomPageProps) {
  const { id } = await params;

  // Fetch property data to verify it exists and get name
  const property = await api.property.getById({ id }).catch(() => {
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
              href={`/admin/properties/${id}`}
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Add Room to {property?.name ?? "Property"}
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Create a new room within this property.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <RoomForm propertyId={id} />
        </div>
      </div>
    </div>
  );
}
