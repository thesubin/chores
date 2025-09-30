import Link from "next/link";
import { ReportsTable } from "../_components/reports-table";

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Link
          className="rounded bg-blue-600 px-3 py-2 text-white"
          href="/admin/reports/new"
        >
          New Report
        </Link>
      </div>
      <ReportsTable />
    </div>
  );
}
