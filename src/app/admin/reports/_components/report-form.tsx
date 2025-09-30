"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { api } from "~/trpc/react";

type ReportInput = {
  title: string;
  description?: string;
  type: "TASKS" | "PAYMENTS" | "TENANTS" | "CUSTOM";
  filters?: unknown;
  isActive?: boolean;
};

type ReportFormProps = {
  initialData?: string | null;
};

export function ReportForm({ initialData }: ReportFormProps) {
  const router = useRouter();
  const parsedInitialData = initialData ? JSON.parse(initialData) : null;

  const [title, setTitle] = useState(parsedInitialData?.title ?? "");
  const [description, setDescription] = useState(
    parsedInitialData?.description ?? "",
  );
  const [type, setType] = useState<ReportInput["type"]>(
    parsedInitialData?.type ?? "TASKS",
  );
  const [isActive, setIsActive] = useState<boolean>(
    parsedInitialData?.isActive ?? true,
  );
  const [filters, setFilters] = useState<string>(
    parsedInitialData?.filters
      ? JSON.stringify(parsedInitialData.filters, null, 2)
      : "{}",
  );

  const utils = api.useUtils();
  const createMutation = api.report.create.useMutation({
    onSuccess: async () => {
      await utils.report.getAll.invalidate();
      toast.success("Report created");
      router.push("/admin/reports");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = api.report.update.useMutation({
    onSuccess: async (res) => {
      await Promise.all([
        utils.report.getAll.invalidate(),
        utils.report.getById.invalidate(res.id),
      ]);
      toast.success("Report updated");
      router.push(`/admin/reports/${res.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    let parsed: unknown = undefined;
    try {
      parsed = filters ? JSON.parse(filters) : undefined;
    } catch {
      toast.error("Filters must be valid JSON");
      return;
    }

    if (parsedInitialData?.id) {
      updateMutation.mutate({
        id: parsedInitialData.id,
        title,
        description,
        type,
        isActive,
        filters: parsed,
      });
    } else {
      createMutation.mutate({
        title,
        description,
        type,
        isActive,
        filters: parsed,
      });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          className="w-full rounded border px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Type</label>
        <select
          className="w-full rounded border px-3 py-2"
          value={type}
          onChange={(e) => setType(e.target.value as ReportInput["type"])}
        >
          <option value="TASKS">Tasks</option>
          <option value="PAYMENTS">Payments</option>
          <option value="TENANTS">Tenants</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="active"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <label htmlFor="active">Active</label>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Filters (JSON)</label>
        <textarea
          className="w-full rounded border px-3 py-2 font-mono"
          rows={8}
          value={filters}
          onChange={(e) => setFilters(e.target.value)}
          placeholder=""
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border px-4 py-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          {initialData ? "Save Changes" : "Create Report"}
        </button>
      </div>
    </form>
  );
}
