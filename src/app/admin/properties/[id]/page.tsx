import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PencilIcon,
  HomeIcon,
  UsersIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

import { api } from "~/trpc/server";
import { DeletePropertyButton } from "../_components/delete-property-button";

interface PropertyDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PropertyDetailsPage({
  params,
}: PropertyDetailsPageProps) {
  // Fetch property data
  const { id } = await params;
  let property;
  try {
    property = await api.property.getById({ id });
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
              href="/admin/properties"
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {property?.name ?? "Property"}
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                {property?.address ?? "Address"}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 sm:mt-0 sm:ml-16">
          <Link
            href={`/admin/properties/${property?.id ?? "id"}/edit`}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
          >
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit
          </Link>
          <DeletePropertyButton
            propertyId={property?.id ?? "id"}
            propertyName={property?.name ?? "Property"}
          />
        </div>
      </div>

      {/* Property Details */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            {/* Property Information */}
            <div className="sm:col-span-2">
              <div className="flex items-center">
                <div className="h-20 w-20 flex-shrink-0">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-100">
                    <HomeIcon className="h-10 w-10 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {property?.name ?? "Property"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {property?.address ?? "Address"}
                  </p>
                  <div className="mt-1 flex space-x-4">
                    <span className="inline-flex items-center text-sm text-gray-500">
                      <span className="mr-1">🚪</span>
                      {property?._count?.rooms ?? 0} rooms
                    </span>
                    <span className="inline-flex items-center text-sm text-gray-500">
                      <span className="mr-1">👥</span>
                      {property?._count?.tenants ?? 0} tenants
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {property?.description && (
              <div className="sm:col-span-2">
                <h3 className="text-lg font-medium text-gray-900">
                  Description
                </h3>
                <div className="mt-2 text-sm text-gray-500">
                  {property?.description}
                </div>
              </div>
            )}

            {/* Property Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Property Details
              </h3>
              <dl className="mt-2 divide-y divide-gray-200">
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">ID</dt>
                  <dd className="text-sm text-gray-900">{property?.id}</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(property?.createdAt ?? "").toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Last Updated
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(property?.updatedAt ?? "").toLocaleDateString()}
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
                  href={`/admin/properties/${property?.id ?? "id"}/rooms`}
                  className="block rounded-md bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  Manage Rooms
                </Link>
                <Link
                  href={`/admin/properties/${property?.id ?? "id"}/rooms/new`}
                  className="block rounded-md bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  Add New Room
                </Link>
                <Link
                  href={`/admin/properties/${property?.id ?? "id"}/tenants`}
                  className="block rounded-md bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                >
                  View Tenants
                </Link>
                <Link
                  href={`/admin/properties/${property?.id ?? "id"}/tasks`}
                  className="block rounded-md bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100"
                >
                  Manage Tasks
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Rooms</h2>
          <Link
            href={`/admin/properties/${property?.id ?? "id"}/rooms/new`}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Add Room
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            {property?.rooms && property?.rooms.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {property?.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="rounded-lg border border-gray-200 p-4 hover:border-gray-300"
                  >
                    <h3 className="text-lg font-medium text-gray-900">
                      {room?.name}
                    </h3>
                    {room.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {room?.description}
                      </p>
                    )}
                    <div className="mt-4 flex justify-end">
                      <Link
                        href={`/admin/rooms/${room?.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">🚪</div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No rooms
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new room for this property.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/admin/properties/${property?.id ?? "id"}/rooms/new`}
                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <PlusIcon className="mr-2 h-5 w-5" />
                    Add New Room
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tenants */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Tenants</h2>
          <Link
            href={`/admin/tenants/new?propertyId=${property?.id ?? "id"}`}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Add Tenant
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            {property?.tenants && property?.tenants.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {property?.tenants.map((tenant) => (
                  <div key={tenant.id} className="py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                          <span className="text-sm font-medium text-gray-700">
                            {tenant.user.name?.[0]?.toUpperCase() ??
                              tenant.user.email?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {tenant.user.name ?? "No Name"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {tenant.user.email}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <Link
                          href={`/admin/tenants/${tenant?.id}`}
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
                  Get started by adding tenants to this property.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/admin/tenants/new?propertyId=${property?.id ?? "id"}`}
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
    </div>
  );
}
