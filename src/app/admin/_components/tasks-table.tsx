"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { type ColumnDef } from "@tanstack/react-table";
import { PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { DataTable } from "~/components/ui/data-table";
import { api } from "~/trpc/react";

// Define the Task type
interface Task {
  id: string;
  title: string;
  description: string | null;
  propertyId: string;
  roomId: string | null;
  frequency: string;
  intervalDays: number | null;
  estimatedDuration: number | null;
  priority: number;
  assignToAll: boolean;
  maxAssignments: number | null;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    name: string;
  };
  room: {
    id: string;
    name: string;
  } | null;
  _count?: {
    assignments: number;
    completions: number;
  };
}

interface TasksTableProps {
  data: string;
  propertyId?: string;
  roomId?: string;
}

export function TasksTable({ data, propertyId, roomId }: TasksTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Parse data from string (due to serialization)
  const parsedData = JSON.parse(data) as Task[];

  // Format frequency
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

  // Format priority
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

  // Delete task mutation
  const deleteTask = api.task.delete.useMutation({
    onSuccess: () => {
      toast.success("Task deleted successfully");
      setDeletingId(null);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setDeletingId(null);
    },
  });

  // Handle delete
  const handleDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the task "${title}"? This action cannot be undone and will remove all assignments and completions for this task.`,
    );

    if (confirmed) {
      setDeletingId(id);
      try {
        await deleteTask.mutateAsync({ id });
      } catch (error) {
        // Error is handled in the mutation callbacks
        console.error("Delete error:", error);
      }
    }
  };

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "title",
      header: "Task",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {task.title}
            </div>
            <div className="text-sm text-gray-500">
              {task.property.name}
              {task.room && ` - ${task.room.name}`}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "frequency",
      header: "Frequency",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div className="text-sm text-gray-900">
            {formatFrequency(task.frequency, task.intervalDays)}
          </div>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as number;
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              priority >= 4
                ? "bg-red-100 text-red-800"
                : priority === 3
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
            }`}
          >
            {formatPriority(priority)}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              task.isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {task.isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      accessorKey: "assignments",
      header: "Assignments",
      cell: ({ row }) => {
        const task = row.original;
        const completed = task._count?.completions ?? 0;
        const pending = (task._count?.assignments ?? 0) - completed;

        return (
          <div className="text-sm text-gray-900">
            {pending > 0 && (
              <span className="mr-2 text-yellow-600">{pending} pending</span>
            )}
            {completed > 0 && (
              <span className="text-green-600">{completed} completed</span>
            )}
            {pending === 0 && completed === 0 && (
              <span className="text-gray-500">No assignments</span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div className="flex items-center justify-end space-x-2">
            <Link
              href={`/admin/tasks/${task.id}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <EyeIcon className="h-4 w-4" />
            </Link>
            <Link
              href={`/admin/tasks/${task.id}/edit`}
              className="text-blue-600 hover:text-blue-900"
            >
              <PencilIcon className="h-4 w-4" />
            </Link>
            <button
              onClick={() => handleDelete(task.id, task.title)}
              disabled={deletingId === task.id}
              className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={parsedData} searchKey="title" />;
}
