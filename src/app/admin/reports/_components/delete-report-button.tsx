"use client";

import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";

export function DeleteReportButton({
  id,
  label = "Delete",
}: {
  id: string;
  label?: string;
}) {
  const utils = api.useUtils();
  const mutation = api.report.delete.useMutation({
    onSuccess: async () => {
      await utils.report.getAll.invalidate();
      toast.success("Report deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <button
      className="text-red-600 hover:underline"
      onClick={() => {
        if (confirm("Are you sure you want to delete this report?")) {
          mutation.mutate(id);
        }
      }}
    >
      {label}
    </button>
  );
}
