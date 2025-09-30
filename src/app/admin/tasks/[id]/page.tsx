import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PencilIcon,
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

import { api } from "~/trpc/server";
import { DeleteTaskButton } from "../_components/delete-task-button";
import { TaskAssignmentList } from "../_components/task-assignment-list";
import { TaskCompletionList } from "../_components/task-completion-list";

interface TaskDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function TaskDetailsPage({
  params,
}: TaskDetailsPageProps) {
  // Fetch task data
  const task = await api.task.getById({ id: params.id }).catch(() => {
    notFound();
    // This return is just to satisfy TypeScript, notFound() throws an error
    return null;
  });

  // Helper function to format the frequency
  const formatFrequency = (frequency: string, intervalDays?: number | null) => {
    switch (frequency) {
      case "ONCE":
        return "One-time";
      case "DAILY":
        return "Daily";
      case "WEEKLY":
        return "Weekly";
      case "MONTHLY":
        return "Monthly";
      case "CUSTOM":
        return `Every ${intervalDays ?? "?"} days`;
      default:
        return frequency;
    }
  };

  // Helper function to format priority
  const formatPriority = (priority: number) => {
    switch (priority) {
      case 1:
        return "Low";
      case 2:
        return "Medium-Low";
      case 3:
        return "Medium";
      case 4:
        return "Medium-High";
      case 5:
        return "High";
      default:
        return `Priority ${priority}`;
    }
  };

  // Format date with Canadian Eastern Time
  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return "N/A";
    const dateObj = new Date(date);
    // Format date in Canadian Eastern Time
    return (
      dateObj.toLocaleDateString("en-CA", {
        timeZone: "America/Toronto",
        year: "numeric",
        month: "long",
        day: "numeric",
      }) + " (ET)"
    ); // Explicitly show it's Eastern Time
  };

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
                {task?.title ?? "Task"}
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                {task?.property?.name ?? "Property"}
                {task?.room && ` - ${task.room.name}`}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 sm:mt-0 sm:ml-16">
          <Link
            href={`/admin/tasks/${task?.id ?? "id"}/edit`}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
          >
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit
          </Link>
          <DeleteTaskButton
            taskId={task?.id ?? "id"}
            taskTitle={task?.title ?? "this task"}
          />
        </div>
      </div>

      {/* Task Details */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            {/* Task Information */}
            <div className="sm:col-span-2">
              <div className="flex items-center">
                <div className="h-20 w-20 flex-shrink-0">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-100">
                    <ClipboardDocumentCheckIcon className="h-10 w-10 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {task?.title ?? "Task Title"}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        task?.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {task?.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {formatFrequency(
                        task?.frequency ?? "ONCE",
                        task?.intervalDays,
                      )}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      {formatPriority(task?.priority ?? 1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {task?.description && (
              <div className="sm:col-span-2">
                <h3 className="text-lg font-medium text-gray-900">
                  Description
                </h3>
                <div className="mt-2 text-sm whitespace-pre-wrap text-gray-500">
                  {task.description}
                </div>
              </div>
            )}

            {/* Task Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Task Details
              </h3>
              <dl className="mt-2 divide-y divide-gray-200">
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Location
                  </dt>
                  <dd className="text-sm text-gray-900">
                    <Link
                      href={`/admin/properties/${task?.propertyId ?? ""}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {task?.property?.name ?? "Property"}
                    </Link>
                    {task?.room && (
                      <span>
                        {" - "}
                        <Link
                          href={`/admin/rooms/${task.roomId ?? ""}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {task.room.name}
                        </Link>
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Frequency
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {formatFrequency(
                      task?.frequency ?? "ONCE",
                      task?.intervalDays,
                    )}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Priority
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {formatPriority(task?.priority ?? 1)}
                  </dd>
                </div>
                {task?.estimatedDuration && (
                  <div className="flex justify-between py-3">
                    <dt className="text-sm font-medium text-gray-500">
                      Estimated Duration
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {task.estimatedDuration} minutes
                    </dd>
                  </div>
                )}
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Assignment Type
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {task?.assignToAll
                      ? "All tenants (rotation)"
                      : task?.useRotation
                        ? "Specific tenants (rotation)"
                        : "Specific tenants"}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Created By
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {task?.createdBy?.name ?? task?.createdBy?.email ?? "Admin"}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(task?.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Assignment Stats */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Assignment Stats
              </h3>
              <dl className="mt-2 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-green-50 p-3 text-center">
                  <dt className="text-sm font-medium text-green-800">
                    <CheckCircleIcon className="mx-auto mb-1 h-5 w-5" />
                    Completed
                  </dt>
                  <dd className="mt-1 text-xl font-semibold text-green-900">
                    {task?.assignments?.filter((a) => a.status === "COMPLETED")
                      .length ?? 0}
                  </dd>
                </div>
                <div className="rounded-lg bg-yellow-50 p-3 text-center">
                  <dt className="text-sm font-medium text-yellow-800">
                    <ClockIcon className="mx-auto mb-1 h-5 w-5" />
                    Pending
                  </dt>
                  <dd className="mt-1 text-xl font-semibold text-yellow-900">
                    {task?.assignments?.filter(
                      (a) =>
                        a.status === "PENDING" || a.status === "IN_PROGRESS",
                    ).length ?? 0}
                  </dd>
                </div>
              </dl>
              {task?.recurrences && task.recurrences.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700">
                    Next Recurrence
                  </h4>
                  <div className="mt-1 flex items-center text-sm text-gray-900">
                    <CalendarIcon className="mr-1 h-4 w-4 text-gray-500" />
                    {formatDate(task.recurrences[0]?.nextDueDate)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current Assignments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Current Assignments
          </h2>
          <Link
            href={`/admin/tasks/new?propertyId=${task?.propertyId ?? ""}`}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Assign New Task
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <TaskAssignmentList
              assignments={
                task?.assignments?.filter(
                  (a) => a.status === "PENDING" || a.status === "IN_PROGRESS",
                ) ?? []
              }
            />
          </div>
        </div>
      </div>

      {/* Completed Assignments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Completion History
          </h2>
        </div>
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <TaskCompletionList
              assignments={
                task?.assignments?.filter(
                  (a) =>
                    a.status === "COMPLETED" &&
                    a.completions &&
                    a.completions.length > 0,
                ) ?? []
              }
            />
          </div>
        </div>
      </div>
      {/* Completed Assignments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Overdue Tasks</h2>
        </div>
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <TaskCompletionList
              assignments={
                task?.assignments?.filter(
                  (a) =>
                    a.status === "OVERDUE" &&
                    a.completions &&
                    a.completions.length > 0,
                ) ?? []
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
