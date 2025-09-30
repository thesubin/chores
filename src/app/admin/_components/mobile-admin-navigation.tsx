"use client";

import { useState } from "react";
import Link from "next/link";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: "📊" },
  { name: "Properties", href: "/admin/properties", icon: "🏢" },
  { name: "Rooms", href: "/admin/rooms", icon: "🚪" },
  { name: "Tenants", href: "/admin/tenants", icon: "👥" },
  { name: "Users", href: "/admin/users", icon: "👤" },
  { name: "Tasks", href: "/admin/tasks", icon: "📋" },
  { name: "Reports", href: "/admin/reports", icon: "📈" },
];

interface MobileAdminNavigationProps {
  user: {
    name?: string | null | undefined;
    email?: string | null | undefined;
  };
}

export function MobileAdminNavigation({ user }: MobileAdminNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden">
        <div className="flex h-16 items-center justify-between bg-white px-4 shadow-sm">
          <h1 className="text-lg font-bold text-blue-600">Admin Panel</h1>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile navigation menu */}
        {isOpen && (
          <div className="absolute top-16 right-0 left-0 z-50 bg-white shadow-lg lg:hidden">
            <nav className="space-y-1 px-2 py-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="group flex items-center rounded-md px-2 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Mobile user info */}
            <div className="border-t px-4 py-3">
              <div className="mb-2">
                <p className="text-sm font-medium text-gray-700">
                  {user.name ?? user.email}
                </p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <Link
                href="/api/auth/signout"
                onClick={() => setIsOpen(false)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Sign Out
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
