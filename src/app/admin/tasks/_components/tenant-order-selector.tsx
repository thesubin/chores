"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Tenant = {
  userId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

type TenantOrderSelectorProps = {
  tenants: Tenant[];
  selectedOrder: string[];
  onOrderChange: (order: string[]) => void;
  disabled?: boolean;
};

export function TenantOrderSelector({
  tenants,
  selectedOrder,
  onOrderChange,
  disabled = false,
}: TenantOrderSelectorProps) {
  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    if (selectedOrder.length > 0) {
      setOrder(selectedOrder);
    } else {
      // Default to tenant creation order
      setOrder(tenants.map((t) => t.userId));
    }
  }, [selectedOrder, tenants]);

  const move = (index: number, dir: -1 | 1) => {
    if (disabled) return;

    setOrder((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j]!, next[index]!];
      onOrderChange(next);
      return next;
    });
  };

  const byId = tenants.reduce((map, tenant) => {
    map.set(tenant.userId, tenant.user);
    return map;
  }, new Map<string, { id: string; name: string | null; image: string | null }>());

  return (
    <div className="space-y-2">
      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {order.map((userId, idx) => {
          const user = byId.get(userId);
          if (!user) return null;

          return (
            <li
              key={userId}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? "User"}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gray-200" />
                )}
                <span className="text-sm font-medium text-gray-900">
                  {user.name ?? userId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0 || disabled}
                  className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === order.length - 1 || disabled}
                  className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                >
                  Down
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-gray-500">
        Use Up/Down buttons to reorder tenants. The task will rotate in this
        order.
      </p>
    </div>
  );
}
