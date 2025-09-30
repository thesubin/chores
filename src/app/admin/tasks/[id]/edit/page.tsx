import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

import { api } from "~/trpc/server";
import { TaskForm } from "../../_components/task-form";

interface EditTaskPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  // Fetch task data
  const { id } = await params;
  const task = await api.task.getById({ id }).catch(() => {
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
              href={`/admin/tasks/${id}`}
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Task</h1>
              <p className="mt-2 text-sm text-gray-700">
                Update task details and assignment settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <TaskForm initialData={JSON.stringify(task)} isEditing />
        </div>
      </div>
    </div>
  );
}
