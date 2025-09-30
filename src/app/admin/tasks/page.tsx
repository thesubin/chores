import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Suspense } from "react";

import { api } from "~/trpc/server";
import { TasksTable } from "../_components/tasks-table";
import { TasksTableSkeleton } from "../_components/tasks-table-skeleton";

export default async function TasksPage() {
  const tasks = await api.task.getAll();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage tasks, assign to tenants, and track completions.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/admin/tasks/new"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="mr-2 inline h-4 w-4" />
            Create Task
          </Link>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <Suspense fallback={<TasksTableSkeleton />}>
            <TasksTable data={JSON.stringify(tasks)} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
