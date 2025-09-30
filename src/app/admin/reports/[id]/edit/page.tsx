import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { ReportForm } from "../../_components/report-form";

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await api.report.getById(id).catch(() => null);
  if (!report) return notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit Report</h1>
      <ReportForm initialData={JSON.stringify(report)} />
    </div>
  );
}
