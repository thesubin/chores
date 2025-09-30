import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PencilIcon,
  HomeIcon,
  UsersIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";

import { api } from "~/trpc/server";
import { DeleteRoomButton } from "../_components/delete-room-button";

interface RoomDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RoomDetailsPage({
  params,
}: RoomDetailsPageProps) {
  // Fetch room data
  let room;
  const { id } = await params;
  try {
    room = await api.room.getById({ id });
  } catch (error) {
    console.error(error);
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center">
            <Link
              href={`/admin/properties/${room?.propertyId ?? "propertyId"}`}
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {room?.name ?? "Room"}
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                <Link
                  href={`/admin/properties/${room?.propertyId ?? "propertyId"}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {room?.property?.name ?? "Property"}
                </Link>
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 sm:mt-0 sm:ml-16">
          <Link
            href={`/admin/rooms/${room?.id ?? "id"}/edit`}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
          >
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit
          </Link>
          <DeleteRoomButton
            roomId={room?.id ?? "id"}
            roomName={room?.name ?? "Room"}
            propertyId={room?.propertyId ?? "propertyId"}
          />
        </div>
      </div>

      {/* Room Details */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            {/* Room Information */}
            <div className="sm:col-span-2">
              <div className="flex items-center">
                <div className="h-20 w-20 flex-shrink-0">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-100">
                    <HomeIcon className="h-10 w-10 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {room?.name ?? "Room"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Part of{" "}
                    <Link
                      href={`/admin/properties/${room?.propertyId ?? "propertyId"}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {room?.property?.name ?? "Property"}
                    </Link>
                  </p>
                  <div className="mt-1 flex space-x-4">
                    <span className="inline-flex items-center text-sm text-gray-500">
                      <span className="mr-1">👥</span>
                      {room?.tenants?.length ?? 0} tenants
                    </span>
                    <span className="inline-flex items-center text-sm text-gray-500">
                      <span className="mr-1">📋</span>
                      {room?.tasks?.length ?? 0} tasks
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {room?.description && (
              <div className="sm:col-span-2">
                <h3 className="text-lg font-medium text-gray-900">
                  Description
                </h3>
                <div className="mt-2 text-sm text-gray-500">
                  {room?.description}
                </div>
              </div>
            )}

            {/* Room Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Room Details
              </h3>
              <dl className="mt-2 divide-y divide-gray-200">
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">ID</dt>
                  <dd className="text-sm text-gray-900">{room?.id ?? "id"}</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(room?.createdAt ?? "").toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Last Updated
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(room?.updatedAt ?? "").toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Quick Actions
              </h3>
              <div className="mt-2 space-y-2">
                <Link
                  href={`/admin/rooms/${room?.id ?? "id"}/tasks`}
                  className="block rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  Manage Tasks
                </Link>
                <Link
                  href={`/admin/rooms/${room?.id ?? "id"}/tasks/new`}
                  className="block rounded-md bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100"
                >
                  Assign New Task
                </Link>
                <Link
                  href={`/admin/tenants/new?roomId=${room?.id ?? "id"}&propertyId=${room?.propertyId ?? "propertyId"}`}
                  className="block rounded-md bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                >
                  Add Tenant
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tenants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Tenants</h2>
          <Link
            href={`/admin/tenants/new?roomId=${room?.id ?? "id"}&propertyId=${room?.propertyId ?? "propertyId"}`}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Add Tenant
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            {room?.tenants && room?.tenants.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {room?.tenants.map((tenant) => (
                  <div key={tenant.id} className="py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                          <span className="text-sm font-medium text-gray-700">
                            {tenant.user.name?.[0]?.toUpperCase() ??
                              tenant.user.email?.[0]?.toUpperCase() ??
                              "No Name"}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {tenant.user.name ?? "No Name"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {tenant.user.email ?? "No Email"}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <Link
                          href={`/admin/tenants/${tenant?.id ?? "id"}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <UsersIcon className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No tenants
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding tenants to this room.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/admin/tenants/new?roomId=${room?.id ?? "id"}&propertyId=${room?.propertyId ?? "propertyId"}`}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                  >
                    Add Tenant
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
          <Link
            href={`/admin/rooms/${room?.id ?? "id"}/tasks/new`}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Assign Task
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            {room?.tasks && room?.tasks.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {room?.tasks.map((task) => (
                  <div key={task.id} className="py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <ClipboardIcon className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {task?.title ?? "No Title"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {task?.description?.substring(0, 50)}
                          {task?.description && task?.description.length > 50
                            ? "..."
                            : ""}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <Link
                          href={`/admin/tasks/${task?.id ?? "id"}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <ClipboardIcon className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No tasks
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by assigning tasks to this room.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/admin/rooms/${room?.id ?? "id"}/tasks/new`}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                  >
                    Assign Task
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
