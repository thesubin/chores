"use client";

import { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";

type Assignment = {
  id: string;
  dueDate: string | Date;
  status: "PENDING" | "IN_PROGRESS" | "OVERDUE" | "COMPLETED";
  task: {
    id: string;
    title: string;
    description: string | null;
    priority: number;
    property: { id: string; name: string };
    room: { id: string; name: string } | null;
  };
};

function formatET(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric",
  });
}

function isPastDue(date: string | Date) {
  const due = new Date(
    new Date(date).toLocaleString("en-US", { timeZone: "America/Toronto" }),
  );
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Toronto" }),
  );
  return due.getTime() < now.getTime();
}

export default function TenantTodo() {
  const utils = api.useUtils();
  const { data, isLoading, isFetching } = api.task.getMyTasks.useQuery();
  const { data: upcoming, isLoading: isLoadingUpcoming } =
    api.task.getMyUpcomingTasks.useQuery();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "ALL" | "TODAY" | "OVERDUE" | "IN_PROGRESS"
  >("ALL");
  const [completingId, setCompletingId] = useState<string | null>(null);

  const completeTask = api.task.completeTask.useMutation({
    onSuccess: async () => {
      toast.success("Task completed");
      setCompletingId(null);
      await utils.task.getMyTasks.invalidate();
    },
    onError: (e) => {
      setCompletingId(null);
      toast.error(e.message);
    },
  });

  const filtered = useMemo(() => {
    const assignments = (data ?? []) as Assignment[];
    const q = search.trim().toLowerCase();
    const todayStr = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Toronto" }),
    ).toDateString();
    return assignments
      .filter((a) => {
        if (q) {
          const hay =
            `${a.task.title} ${a.task.description ?? ""} ${a.task.property.name} ${a.task.room?.name ?? ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (filter === "OVERDUE")
          return a.status === "OVERDUE" || isPastDue(a.dueDate);
        if (filter === "IN_PROGRESS") return a.status === "IN_PROGRESS";
        if (filter === "TODAY")
          return new Date(a.dueDate).toDateString() === todayStr;
        return true;
      })
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );
  }, [data, search, filter]);

  const handleToggleComplete = async (
    assignmentId: string,
    checked: boolean,
  ) => {
    if (!checked) return; // only complete on check
    setCompletingId(assignmentId);
    try {
      await completeTask.mutateAsync({ assignmentId });
    } catch (err) {
      // handled in onError
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-2 py-4 sm:px-4 sm:py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
          Your Tasks
        </h2>
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {(["ALL", "TODAY", "OVERDUE", "IN_PROGRESS"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-2 py-1 text-xs font-medium transition sm:px-3 sm:text-sm ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f === "ALL"
                ? "All"
                : f === "TODAY"
                  ? "Today"
                  : f === "OVERDUE"
                    ? "Overdue"
                    : "In Progress"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks, rooms, properties..."
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 sm:text-base"
        />
      </div>

      <div className="rounded-lg border bg-white">
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="h-5 w-5 animate-pulse rounded border bg-gray-100" />
                <div className="flex-1">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                  <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                </div>
                <div className="h-6 w-20 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-600">
            <p className="mb-2">No tasks to show.</p>
            <p>You&apos;re all caught up! 🎉</p>
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((a) => {
              const overdue = a.status === "OVERDUE" || isPastDue(a.dueDate);
              const inProgress = a.status === "IN_PROGRESS";
              return (
                <li
                  key={a.id}
                  className="group flex items-start gap-3 p-3 sm:p-4"
                >
                  <input
                    type="checkbox"
                    disabled={completingId === a.id || isFetching}
                    onChange={(e) =>
                      handleToggleComplete(a.id, e.target.checked)
                    }
                    className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 sm:h-5 sm:w-5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium break-words text-gray-900">
                          {a.task.title}
                        </p>
                        {a.task.description ? (
                          <p className="mt-1 line-clamp-2 text-sm break-words text-gray-600">
                            {a.task.description}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-gray-600 sm:gap-2">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5">
                            {a.task.property.name}
                          </span>
                          {a.task.room ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5">
                              {a.task.room.name}
                            </span>
                          ) : null}
                          <span
                            className={`rounded-full px-2 py-0.5 ${
                              a.task.priority >= 4
                                ? "bg-red-100 text-red-800"
                                : a.task.priority === 3
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            Priority {a.task.priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:shrink-0 sm:flex-col sm:text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold sm:px-2.5 ${
                            overdue
                              ? "bg-red-100 text-red-800"
                              : inProgress
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {overdue
                            ? "Overdue"
                            : inProgress
                              ? "In Progress"
                              : "Pending"}
                        </span>
                        <div className="text-xs text-gray-600 sm:mt-2">
                          Due {formatET(a.dueDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Upcoming Section */}
      <div className="mt-6 sm:mt-8">
        <h3 className="mb-3 text-base font-semibold text-gray-900 sm:text-lg">
          Upcoming
        </h3>
        <div className="rounded-lg border bg-white">
          {isLoadingUpcoming ? (
            <div className="divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 sm:p-4">
                  <div className="h-4 w-4 animate-pulse rounded border bg-gray-100 sm:h-5 sm:w-5" />
                  <div className="flex-1">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                    <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                  </div>
                  <div className="h-6 w-20 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : (upcoming?.length ?? 0) === 0 ? (
            <div className="p-4 text-sm text-gray-600 sm:p-6">
              No upcoming tasks yet.
            </div>
          ) : (
            <ul className="divide-y">
              {(upcoming ?? []).map((t) => (
                <li
                  key={t.id}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium break-words text-gray-900">
                      {t.title}
                    </p>
                    {t.description ? (
                      <p className="mt-1 line-clamp-2 text-sm break-words text-gray-600">
                        {t.description}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-gray-600 sm:gap-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5">
                        {t.property.name}
                      </span>
                      {t.room ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5">
                          {t.room.name}
                        </span>
                      ) : null}
                      <span
                        className={`${
                          (t.priority ?? 1) >= 4
                            ? "rounded-full bg-red-100 px-2 py-0.5 text-red-800"
                            : (t.priority ?? 1) === 3
                              ? "rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-800"
                              : "rounded-full bg-green-100 px-2 py-0.5 text-green-800"
                        }`}
                      >
                        Priority {t.priority ?? 1}
                      </span>
                      {t.currentlyAssignedToSomeoneElse ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">
                          In rotation
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:shrink-0 sm:flex-col sm:text-right">
                    <div className="text-xs text-gray-600">
                      Next due {t.nextDueDate ? formatET(t.nextDueDate) : "TBD"}
                    </div>
                    {typeof t.daysUntilMyTurn === "number" && (
                      <div className="mt-1 text-xs text-gray-600 sm:mt-0">
                        In about {t.daysUntilMyTurn} day
                        {t.daysUntilMyTurn === 1 ? "" : "s"}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
