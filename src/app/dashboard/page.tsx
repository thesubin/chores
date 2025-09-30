import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // User data will be fetched on-demand when needed

  return (
    <HydrateClient>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Chores Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {session.user.name ?? session.user.email}
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  {session.user.role}
                </span>
                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  href="/api/auth/signout"
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Sign Out
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Quick Stats */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500">
                      <span className="text-sm font-medium text-white">P</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500">
                        Properties
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {session.user.role === "ADMIN" ? "Manage" : "View"}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link
                    href="/properties"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    View all properties
                  </Link>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500">
                      <span className="text-sm font-medium text-white">T</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500">
                        Tasks
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {session.user.role === "ADMIN" ? "Assign" : "Complete"}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link
                    href="/tasks"
                    className="font-medium text-green-600 hover:text-green-500"
                  >
                    {session.user.role === "ADMIN"
                      ? "Manage tasks"
                      : "My tasks"}
                  </Link>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500">
                      <span className="text-sm font-medium text-white">U</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-gray-500">
                        {session.user.role === "ADMIN" ? "Tenants" : "Profile"}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {session.user.role === "ADMIN" ? "Monitor" : "Update"}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link
                    href={
                      session.user.role === "ADMIN" ? "/tenants" : "/profile"
                    }
                    className="font-medium text-purple-600 hover:text-purple-500"
                  >
                    {session.user.role === "ADMIN"
                      ? "View tenants"
                      : "My profile"}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <div className="rounded-lg bg-white shadow">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Activity
                </h3>
                <div className="mt-5">
                  <div className="text-sm text-gray-500">
                    <p>
                      Welcome to your dashboard! This is where you&apos;ll see
                      your recent activity and important updates.
                    </p>
                    {session.user.role === "ADMIN" && (
                      <p className="mt-2">
                        As an admin, you can manage properties, assign tasks,
                        and monitor tenant progress.
                      </p>
                    )}
                    {session.user.role === "TENANT" && (
                      <p className="mt-2">
                        As a tenant, you can view your assigned tasks, track
                        your progress, and manage your payments.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </HydrateClient>
  );
}
