"use client";

import { useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { api } from "~/trpc/react";

interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  assignedById: string | null;
  dueDate: string | Date;
  status: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  completions?: {
    id: string;
    status: string;
    completedAt: string | Date;
    completionNotes?: string | null;
    userId: string;
  }[];
}

interface TaskAssignmentListProps {
  assignments: TaskAssignment[];
}

export function TaskAssignmentList({ assignments }: TaskAssignmentListProps) {
  const router = useRouter();
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Complete task mutation
  const completeTask = api.task.completeTask.useMutation({
    onSuccess: () => {
      toast.success("Task marked as completed");
      setCompletingId(null);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setCompletingId(null);
    },
  });

  // Handle mark as complete
  const handleComplete = async (assignmentId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to mark this task as completed?",
    );

    if (confirmed) {
      setCompletingId(assignmentId);
      try {
        await completeTask.mutateAsync({ assignmentId });
      } catch (error) {
        // Error is handled in the mutation callbacks
        console.error("Completion error:", error);
      }
    }
  };

  // Format date with Canadian Eastern Time
  const formatDate = (date: string | Date) => {
    const dateObj = new Date(date);
    // Format date in Canadian Eastern Time
    return dateObj.toLocaleDateString("en-CA", {
      timeZone: "America/Toronto",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if a date is in the past using Canadian Eastern Time
  const isPastDue = (date: string | Date, status: string) => {
    // If status is already OVERDUE, return true
    if (status === "OVERDUE") return true;

    // Convert both dates to Canadian Eastern Time for comparison
    const dueDate = new Date(date);
    const dueDateET = new Date(
      dueDate.toLocaleString("en-US", { timeZone: "America/Toronto" }),
    );

    const now = new Date();
    const nowET = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Toronto" }),
    );

    // Compare timestamps in ET
    return dueDateET.getTime() < nowET.getTime();
  };

  if (assignments.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <CheckCircleIcon className="h-12 w-12" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No active assignments
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          There are no pending or in-progress assignments for this task.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
              Tenant
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
              Due Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {assignments.map((assignment) => (
            <tr key={assignment.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-8 w-8 flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                      <span className="text-xs font-medium text-gray-600">
                        {assignment.user.name?.[0]?.toUpperCase() ??
                          assignment.user.email?.[0]?.toUpperCase() ??
                          "?"}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {assignment.user.name ?? "No Name"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {assignment.user.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                <span
                  className={
                    isPastDue(assignment.dueDate, assignment.status)
                      ? "font-medium text-red-600"
                      : ""
                  }
                >
                  {formatDate(assignment.dueDate)}
                  {isPastDue(assignment.dueDate, assignment.status) &&
                    " (Overdue)"}
                </span>
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap">
                <span
                  className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${
                    assignment.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : assignment.status === "OVERDUE"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {assignment.status === "PENDING"
                    ? "Pending"
                    : assignment.status === "OVERDUE"
                      ? "Overdue"
                      : "In Progress"}
                </span>
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap">
                <button
                  onClick={() => handleComplete(assignment.id)}
                  disabled={completingId === assignment.id}
                  className="mr-2 text-green-600 hover:text-green-900 disabled:opacity-50"
                >
                  {completingId === assignment.id
                    ? "Completing..."
                    : "Mark Complete"}
                </button>
                <Link
                  href={`/admin/tenants/${assignment.user.id}`}
                  className="text-blue-600 hover:text-blue-900"
                >
                  View Tenant
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
