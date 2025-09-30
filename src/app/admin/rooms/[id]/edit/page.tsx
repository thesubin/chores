import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

import { api } from "~/trpc/server";
import { RoomForm } from "../../_components/room-form";

interface EditRoomPageProps {
  params: {
    id: string;
  };
}

export default async function EditRoomPage({ params }: EditRoomPageProps) {
  // Fetch room data
  let room;
  try {
    room = await api.room.getById({ id: params.id });
  } catch (error) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center">
            <Link
              href={`/admin/rooms/${params.id}`}
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Room</h1>
              <p className="mt-2 text-sm text-gray-700">
                Update room information and details.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <RoomForm initialData={room} isEditing />
        </div>
      </div>
    </div>
  );
}
