"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { api } from "~/trpc/react";

type RotationEditorProps = {
  taskId: string;
};

export function RotationEditor({ taskId }: RotationEditorProps) {
  const utils = api.useUtils();
  const { data, isLoading } = api.task.getRotationOrder.useQuery({ taskId });
  const reorder = api.task.reorderRotation.useMutation({
    onSuccess: async () => {
      setMessage("Rotation order saved successfully!");
      setTimeout(() => setMessage(""), 3000);
      await utils.task.getRotationOrder.invalidate({ taskId });
      await utils.task.getById.invalidate({ id: taskId });
    },
    onError: (error) => {
      console.error("Failed to reorder rotation:", error);
      setMessage(`Error: ${error.message}`);
      setTimeout(() => setMessage(""), 5000);
    },
  });

  const [order, setOrder] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (data) setOrder(data.map((d) => d.userId));
  }, [data]);

  const byId = useMemo(() => {
    const map = new Map<
      string,
      { name?: string | null; image?: string | null }
    >();
    (data ?? []).forEach((d) =>
      map.set(d.userId, { name: d.user?.name, image: d.user?.image }),
    );
    return map;
  }, [data]);

  const move = (index: number, dir: -1 | 1) => {
    setOrder((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j]!, next[index]!];
      return next;
    });
  };

  const save = async () => {
    await reorder.mutateAsync({ taskId, userIds: order });
  };

  if (isLoading)
    return <div className="text-sm text-gray-500">Loading rotation…</div>;
  if (!data || data.length === 0)
    return <div className="text-sm text-gray-500">No users in rotation.</div>;

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.includes("Error")
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {message}
        </div>
      )}
      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {order.map((userId, idx) => {
          const meta = byId.get(userId);
          return (
            <li
              key={userId}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {meta?.image ? (
                  <Image
                    src={meta.image}
                    alt={meta?.name ?? "User"}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gray-200" />
                )}
                <span className="text-sm font-medium text-gray-900">
                  {meta?.name ?? userId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0 || reorder.isPending}
                  className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === order.length - 1 || reorder.isPending}
                  className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                >
                  Down
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={reorder.isPending}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {reorder.isPending ? "Saving…" : "Save Order"}
        </button>
      </div>
    </div>
  );
}
