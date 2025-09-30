import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

import { TaskForm } from "../_components/task-form";

interface NewTaskPageProps {
  searchParams: Promise<{
    propertyId?: string;
    roomId?: string;
    userId?: string;
  }>;
}

export default async function NewTaskPage({ searchParams }: NewTaskPageProps) {
  const { propertyId, roomId, userId } = await searchParams;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center">
            <Link
              href="/admin/tasks"
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Create New Task
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Create a new task and assign it to tenants.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <TaskForm propertyId={propertyId} roomId={roomId} userId={userId} />
        </div>
      </div>
    </div>
  );
}
