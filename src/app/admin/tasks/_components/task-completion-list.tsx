"use client";

import { CheckCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface TaskCompletion {
  id: string;
  taskId: string;
  assignmentId: string;
  userId: string;
  completedAt: string | Date;
  status: string;
  completionNotes?: string | null;
  photos?: string[];
  verifiedBy?: string | null;
  verifiedAt?: string | Date | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  verifier?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  dueDate: string | Date;
  status: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  completions: TaskCompletion[];
}

interface TaskCompletionListProps {
  assignments: TaskAssignment[];
}

export function TaskCompletionList({ assignments }: TaskCompletionListProps) {
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

  // Format time with Canadian Eastern Time
  const formatTime = (date: string | Date) => {
    const dateObj = new Date(date);
    // Format time in Canadian Eastern Time
    return dateObj.toLocaleTimeString("en-CA", {
      timeZone: "America/Toronto",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short", // Add timezone information (ET)
    });
  };

  if (assignments.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <CheckCircleIcon className="h-12 w-12" />
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No completion history
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          No one has completed this task yet.
        </p>
      </div>
    );
  }

  // Flatten assignments to get all completions
  const completions = assignments.flatMap((assignment) =>
    assignment.completions.map((completion) => ({
      ...completion,
      assignment,
    })),
  );

  // Sort completions by completedAt (newest first)
  completions.sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {completions.map((completion, idx) => (
          <li key={completion.id}>
            <div className="relative pb-8">
              {idx !== completions.length - 1 && (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      completion.status === "OVERDUE"
                        ? "bg-red-100"
                        : "bg-green-100"
                    }`}
                  >
                    <CheckCircleIcon
                      className={`h-5 w-5 ${
                        completion.status === "OVERDUE"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-900">
                      {completion.status === "OVERDUE"
                        ? "Missed by"
                        : "Completed by"}{" "}
                      <Link
                        href={`/admin/users/${completion.user.id}`}
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        {completion.user.name ??
                          completion.user.email ??
                          "Unknown"}
                      </Link>
                    </p>
                    {completion.completionNotes && (
                      <p className="mt-1 text-sm text-gray-500">
                        {completion.completionNotes}
                      </p>
                    )}
                    {completion.verifiedBy && (
                      <p className="mt-1 text-xs text-gray-500">
                        Verified by{" "}
                        {completion.verifier?.name ??
                          completion.verifier?.email ??
                          "Admin"}{" "}
                        on{" "}
                        {completion.verifiedAt
                          ? formatDate(completion.verifiedAt)
                          : "Unknown date"}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                    <time
                      dateTime={new Date(completion.completedAt).toISOString()}
                    >
                      {formatDate(completion.completedAt)} at{" "}
                      {formatTime(completion.completedAt)}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
