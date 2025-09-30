import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PencilIcon,
  UserIcon,
  HomeIcon,
  CreditCardIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

import { api } from "~/trpc/server";
import { DeleteTenantButton } from "../_components/delete-tenant-button";

interface TenantDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function TenantDetailsPage({
  params,
}: TenantDetailsPageProps) {
  // Fetch tenant data
  const tenant = await api.tenant.getById({ id: params.id }).catch(() => {
    notFound();
    // This return is just to satisfy TypeScript, notFound() throws an error
    return null;
  });

  // Format currency
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <div className="flex items-center">
            <Link
              href="/admin/tenants"
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {tenant?.user?.name ?? "Tenant"}
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                {tenant?.user?.email ?? "No email"}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 sm:mt-0 sm:ml-16">
          <Link
            href={`/admin/tenants/${tenant?.id ?? "id"}/edit`}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
          >
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit
          </Link>
          <DeleteTenantButton
            tenantId={tenant?.id ?? "id"}
            tenantName={
              tenant?.user?.name ?? tenant?.user?.email ?? "this tenant"
            }
          />
        </div>
      </div>

      {/* Tenant Details */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            {/* Tenant Information */}
            <div className="sm:col-span-2">
              <div className="flex items-center">
                <div className="h-20 w-20 flex-shrink-0">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-100">
                    <UserIcon className="h-10 w-10 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {tenant?.user?.name ?? "No Name"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {tenant?.user?.email ?? "No email"}
                  </p>
                  <div className="mt-1">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Active Tenant
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Property Information
              </h3>
              <dl className="mt-2 divide-y divide-gray-200">
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Property
                  </dt>
                  <dd className="text-sm text-gray-900">
                    <Link
                      href={`/admin/properties/${tenant?.propertyId ?? ""}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {tenant?.property?.name ?? "Not assigned"}
                    </Link>
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">Room</dt>
                  <dd className="text-sm text-gray-900">
                    {tenant?.room ? (
                      <Link
                        href={`/admin/rooms/${tenant.roomId ?? ""}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {tenant.room.name}
                      </Link>
                    ) : (
                      "Not assigned"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Move In Date
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(tenant?.moveInDate)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Lease Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Lease Information
              </h3>
              <dl className="mt-2 divide-y divide-gray-200">
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Monthly Rent
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {formatCurrency(tenant?.monthlyRent)}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Rent Due Day
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {tenant?.rentDueDay ?? "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Lease Period
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(tenant?.leaseStartDate)} to{" "}
                    {formatDate(tenant?.leaseEndDate)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Deposit Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Deposit Information
              </h3>
              <dl className="mt-2 divide-y divide-gray-200">
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Deposit Amount
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {formatCurrency(tenant?.depositAmount)}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">
                    Security Deposit
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {formatCurrency(tenant?.securityDeposit)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Emergency Contact
              </h3>
              <dl className="mt-2 divide-y divide-gray-200">
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="text-sm text-gray-900">
                    {tenant?.emergencyContact ?? "Not provided"}
                  </dd>
                </div>
                <div className="flex justify-between py-3">
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">
                    {tenant?.emergencyPhone ?? "Not provided"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <h3 className="text-lg font-medium text-gray-900">Notes</h3>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Tenant Remarks
                  </h4>
                  <p className="mt-2 text-sm text-gray-500">
                    {tenant?.remarks || "No remarks"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Admin Notes
                  </h4>
                  <p className="mt-2 text-sm text-gray-500">
                    {tenant?.notes || "No notes"}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="sm:col-span-2">
              <h3 className="text-lg font-medium text-gray-900">
                Quick Actions
              </h3>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Link
                  href={`/admin/payments/new?tenantId=${tenant?.id ?? ""}`}
                  className="flex items-center justify-center rounded-md border border-transparent bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  <CreditCardIcon className="mr-2 h-5 w-5" />
                  Record Payment
                </Link>
                <Link
                  href={`/admin/tasks/new?tenantId=${tenant?.id ?? ""}`}
                  className="flex items-center justify-center rounded-md border border-transparent bg-green-50 px-4 py-3 text-sm font-medium text-green-700 hover:bg-green-100"
                >
                  <DocumentTextIcon className="mr-2 h-5 w-5" />
                  Assign Task
                </Link>
                <Link
                  href={`/admin/users/${tenant?.userId ?? ""}`}
                  className="flex items-center justify-center rounded-md border border-transparent bg-purple-50 px-4 py-3 text-sm font-medium text-purple-700 hover:bg-purple-100"
                >
                  <UserIcon className="mr-2 h-5 w-5" />
                  View User Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
          <Link
            href={`/admin/payments/new?tenantId=${tenant?.id ?? ""}`}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Add Payment
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            {tenant?.user?.payments && tenant.user.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                        Reference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tenant.user.payments.map((payment: any) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                          {formatDate(payment.paidDate || payment.dueDate)}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${
                              payment.status === "PAID"
                                ? "bg-green-100 text-green-800"
                                : payment.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                          {payment.paymentMethod || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                          {payment.reference || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <CreditCardIcon className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No payments
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No payment records found for this tenant.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/admin/payments/new?tenantId=${tenant?.id ?? ""}`}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                  >
                    Add Payment
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assigned Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Assigned Tasks</h2>
          <Link
            href={`/admin/tasks/new?tenantId=${tenant?.id ?? ""}`}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Assign Task
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="py-8 text-center">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <DocumentTextIcon className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No tasks
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No tasks assigned to this tenant yet.
              </p>
              <div className="mt-6">
                <Link
                  href={`/admin/tasks/new?tenantId=${tenant?.id ?? ""}`}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  Assign Task
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
