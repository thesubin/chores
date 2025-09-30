import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import TenantTodo from "./_components/tenant-todo";

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Prefetch tenant tasks for fast UX when applicable
  if (session.user.role === "TENANT") {
    await api.task.getMyTasks();
  }

  return (
    <HydrateClient>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-lg font-bold text-gray-900 sm:text-2xl">
                  Chores Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Mobile: Hide welcome text, show only on larger screens */}
                <span className="hidden text-sm text-gray-700 sm:block">
                  Welcome, {session.user.name ?? session.user.email}
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 sm:px-2.5">
                  {session.user.role}
                </span>
                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="hidden text-sm font-medium text-blue-600 hover:text-blue-800 sm:block"
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
        <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
          {session.user.role === "TENANT" ? (
            <div>
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  My To‑Dos
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Check off tasks as you complete them. Due and overdue items
                  are highlighted.
                </p>
              </div>
              <TenantTodo />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {/* Quick Stats */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500">
                          <span className="text-sm font-medium text-white">
                            P
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 w-0 flex-1 sm:ml-5">
                        <dl>
                          <dt className="truncate text-sm font-medium text-gray-500">
                            Properties
                          </dt>
                          <dd className="text-base font-medium text-gray-900 sm:text-lg">
                            {session.user.role === "ADMIN" ? "Manage" : "View"}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-5">
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
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500">
                          <span className="text-sm font-medium text-white">
                            T
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 w-0 flex-1 sm:ml-5">
                        <dl>
                          <dt className="truncate text-sm font-medium text-gray-500">
                            Tasks
                          </dt>
                          <dd className="text-base font-medium text-gray-900 sm:text-lg">
                            {session.user.role === "ADMIN"
                              ? "Assign"
                              : "Complete"}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-5">
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
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500">
                          <span className="text-sm font-medium text-white">
                            U
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 w-0 flex-1 sm:ml-5">
                        <dl>
                          <dt className="truncate text-sm font-medium text-gray-500">
                            {session.user.role === "ADMIN"
                              ? "Tenants"
                              : "Profile"}
                          </dt>
                          <dd className="text-base font-medium text-gray-900 sm:text-lg">
                            {session.user.role === "ADMIN"
                              ? "Monitor"
                              : "Update"}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-5">
                    <div className="text-sm">
                      <Link
                        href={
                          session.user.role === "ADMIN"
                            ? "/tenants"
                            : "/profile"
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
              <div className="mt-6 sm:mt-8">
                <div className="rounded-lg bg-white shadow">
                  <div className="px-4 py-4 sm:p-6 sm:py-5">
                    <h3 className="text-base font-medium text-gray-900 sm:text-lg sm:leading-6">
                      Recent Activity
                    </h3>
                    <div className="mt-4 sm:mt-5">
                      <div className="text-sm text-gray-500">
                        <p>
                          Welcome to your dashboard! This is where you&apos;ll
                          see your recent activity and important updates.
                        </p>
                        {session.user.role === "ADMIN" && (
                          <p className="mt-2">
                            As an admin, you can manage properties, assign
                            tasks, and monitor tenant progress.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </HydrateClient>
  );
}
