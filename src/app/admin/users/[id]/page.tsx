import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, PencilIcon } from "@heroicons/react/24/outline";

import { api } from "~/trpc/server";
import { DeleteUserButton } from "../_components/delete-user-button";

interface UserDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserDetailsPage({
  params,
}: UserDetailsPageProps) {
  // Fetch user data
  let user;
  const { id } = await params;
  try {
    user = await api.auth.getUserById({ id });
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
              href="/admin/users"
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
              <p className="mt-2 text-sm text-gray-700">
                View detailed information about this user.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 sm:mt-0 sm:ml-16">
          <Link
            href={`/admin/users/${user.id}/edit`}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
          >
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit
          </Link>
          <DeleteUserButton
            userId={user.id}
            userName={user.name ?? user.email ?? "this user"}
          />
        </div>
      </div>

      {/* User Details */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            {/* User Profile */}
            <div className="sm:col-span-2">
              <div className="flex items-center">
                <div className="h-20 w-20 flex-shrink-0">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-200">
                    <span className="text-2xl font-medium text-gray-600">
                      {user.name?.[0]?.toUpperCase() ??
                        user.email?.[0]?.toUpperCase() ??
                        "?"}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {user.name ?? "No Name"}
                  </h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Contact Information
              </h3>
              <dl className="mt-2 divide-y divide-gray-200">
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">
                    {user.email ?? "Not provided"}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">
                    {user.phoneNumber ?? "Not provided"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Account Information
              </h3>
              <dl className="mt-2 divide-y divide-gray-200">
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="text-sm text-gray-900">{user.id}</dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Last Updated
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Tenant Information (if applicable) */}
            {user.tenantProfile && (
              <div className="sm:col-span-2">
                <h3 className="text-lg font-medium text-gray-900">
                  Tenant Information
                </h3>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Property
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.tenantProfile.property?.name ?? "Not assigned"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Room</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.tenantProfile.room?.name ?? "Not assigned"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Monthly Rent
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      ${user.tenantProfile.monthlyRent?.toNumber() ?? 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Rent Due Day
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.tenantProfile.rentDueDay}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
