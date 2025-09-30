import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();

  // If user is logged in, redirect to dashboard
  if (session?.user) {
    if (session.user.role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          <span className="text-[hsl(280,100%,70%)]">Chores</span> App
        </h1>
        <p className="max-w-2xl text-center text-xl text-gray-300">
          Streamline property management with automated task assignment, tenant
          tracking, and comprehensive monitoring tools.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-6">
            <h3 className="text-2xl font-bold">For Administrators</h3>
            <div className="text-lg">
              Manage properties, assign tasks, track tenant progress, and
              monitor payments all in one place.
            </div>
          </div>
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-6">
            <h3 className="text-2xl font-bold">For Tenants</h3>
            <div className="text-lg">
              View assigned tasks, track your progress, submit requests, and
              manage your payments easily.
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Link
            href="/api/auth/signin"
            className="rounded-full bg-[hsl(280,100%,70%)] px-10 py-3 font-semibold text-black no-underline transition hover:bg-[hsl(280,100%,60%)]"
          >
            Get Started
          </Link>
          <p className="text-sm text-gray-400">
            Sign in to access your dashboard
          </p>
        </div>
      </div>
    </main>
  );
}
