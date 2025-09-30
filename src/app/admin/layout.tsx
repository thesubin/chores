import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "~/server/auth";
import { MobileAdminNavigation } from "./_components/mobile-admin-navigation";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: "📊" },
  { name: "Properties", href: "/admin/properties", icon: "🏢" },
  { name: "Rooms", href: "/admin/rooms", icon: "🚪" },
  { name: "Tenants", href: "/admin/tenants", icon: "👥" },
  { name: "Users", href: "/admin/users", icon: "👤" },
  { name: "Tasks", href: "/admin/tasks", icon: "📋" },
  { name: "Reports", href: "/admin/reports", icon: "📈" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect if not admin
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      <MobileAdminNavigation user={session.user} />

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:bg-white lg:shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b bg-blue-600">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User info */}
          <div className="border-t p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {session.user.name ?? session.user.email}
                </p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
            <Link
              href="/api/auth/signout"
              className="mt-2 block text-sm text-red-600 hover:text-red-800"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-4 lg:py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
