import { notFound } from "next/navigation";
import Link from "next/link";
import { PlusIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Suspense } from "react";

import { api } from "~/trpc/server";
import { TasksTable } from "../../../_components/tasks-table";
import { TasksTableSkeleton } from "../../../_components/tasks-table-skeleton";

interface PropertyTasksPageProps {
  params: {
    id: string;
  };
}

export default async function PropertyTasksPage({
  params,
}: PropertyTasksPageProps) {
  // Fetch property data
  const property = await api.property.getById({ id: params.id }).catch(() => {
    notFound();
    // This return is just to satisfy TypeScript, notFound() throws an error
    return null;
  });

  // Fetch tasks for this property
  const tasks = await api.task.getByProperty({ propertyId: params.id });

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
                Tasks - {property?.name ?? "Property"}
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Manage tasks for this property.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href={`/admin/tasks/new?propertyId=${params.id}`}
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
            <TasksTable data={JSON.stringify(tasks)} propertyId={params.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
