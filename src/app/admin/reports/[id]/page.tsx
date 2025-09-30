import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "~/trpc/server";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const report = await api.report.getById(id).catch(() => null);
  if (!report) return notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{report.title}</h1>
        <div className="flex gap-2">
          <Link className="rounded border px-3 py-2" href="/admin/reports">
            Back
          </Link>
          <Link
            className="rounded bg-indigo-600 px-3 py-2 text-white"
            href={`/admin/reports/${report.id}/edit`}
          >
            Edit
          </Link>
        </div>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-gray-500">Type</dt>
            <dd className="text-base">{report.type}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Active</dt>
            <dd className="text-base">{report.isActive ? "Yes" : "No"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-gray-500">Description</dt>
            <dd className="text-base whitespace-pre-wrap">
              {report.description ?? "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-gray-500">Filters</dt>
            <dd>
              <pre className="overflow-auto rounded bg-gray-50 p-3 text-sm">
                {JSON.stringify(report.filters ?? {}, null, 2)}
              </pre>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
