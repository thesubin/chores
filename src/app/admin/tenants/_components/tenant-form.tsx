"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { api } from "~/trpc/react";

interface Property {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  propertyId: string;
}

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
}

interface TenantFormProps {
  initialData?: string;
  propertyId?: string;
  roomId?: string;
  userId?: string;
  isEditing?: boolean;
}

export function TenantForm({
  initialData,
  propertyId,
  roomId,
  userId,
  isEditing = false,
}: TenantFormProps) {
  const router = useRouter();
  const parsedInitialData = initialData ? JSON.parse(initialData) : null;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    parsedInitialData?.propertyId ?? propertyId ?? "",
  );

  const [formData, setFormData] = useState({
    userId: parsedInitialData?.userId ?? userId ?? "",
    propertyId: parsedInitialData?.propertyId ?? propertyId ?? "",
    roomId: parsedInitialData?.roomId ?? roomId ?? "",
    monthlyRent: parsedInitialData?.monthlyRent?.toString() ?? "0",
    rentDueDay: parsedInitialData?.rentDueDay?.toString() ?? "1",
    depositAmount: parsedInitialData?.depositAmount?.toString() ?? "",
    securityDeposit: parsedInitialData?.securityDeposit?.toString() ?? "",
    emergencyContact: parsedInitialData?.emergencyContact ?? "",
    emergencyPhone: parsedInitialData?.emergencyPhone ?? "",
    moveInDate: parsedInitialData?.moveInDate
      ? new Date(parsedInitialData.moveInDate).toISOString().split("T")[0]
      : "",
    leaseStartDate: parsedInitialData?.leaseStartDate
      ? new Date(parsedInitialData.leaseStartDate).toISOString().split("T")[0]
      : "",
    leaseEndDate: parsedInitialData?.leaseEndDate
      ? new Date(parsedInitialData.leaseEndDate).toISOString().split("T")[0]
      : "",
    remarks: parsedInitialData?.remarks ?? "",
    notes: parsedInitialData?.notes ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch properties, rooms, and users for dropdowns
  const { data: properties, isLoading: isLoadingProperties } =
    api.property.getAll.useQuery();
  const { data: rooms, isLoading: isLoadingRooms } =
    api.room.getByProperty.useQuery(
      { propertyId: selectedPropertyId },
      { enabled: !!selectedPropertyId },
    );
  const { data: users, isLoading: isLoadingUsers } =
    api.auth.getUsers.useQuery();

  // Parse data if it's a string (due to serialization)
  const parsedProperties = Array.isArray(properties)
    ? properties
    : typeof properties === "string"
      ? JSON.parse(properties)
      : [];

  const parsedRooms = Array.isArray(rooms)
    ? rooms
    : typeof rooms === "string"
      ? JSON.parse(rooms)
      : [];

  const parsedUsers = Array.isArray(users)
    ? users
    : typeof users === "string"
      ? JSON.parse(users)
      : [];

  // API mutations
  const createTenant = api.tenant.create.useMutation({
    onSuccess: () => {
      toast.success("Tenant profile created successfully");
      router.push("/admin/tenants");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  const updateTenant = api.tenant.update.useMutation({
    onSuccess: () => {
      toast.success("Tenant profile updated successfully");
      if (parsedInitialData?.id) {
        router.push(`/admin/tenants/${parsedInitialData.id}`);
      } else {
        router.push("/admin/tenants");
      }
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  // Update roomId options when propertyId changes
  useEffect(() => {
    if (selectedPropertyId !== formData.propertyId) {
      setFormData((prev) => ({
        ...prev,
        propertyId: selectedPropertyId,
        roomId: "", // Reset room when property changes
      }));
    }
  }, [selectedPropertyId, formData.propertyId]);

  // Form handlers
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    // Handle property selection specially to update available rooms
    if (name === "propertyId") {
      setSelectedPropertyId(value);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.userId) {
      newErrors.userId = "Tenant is required";
    }

    if (!formData.propertyId) {
      newErrors.propertyId = "Property is required";
    }

    // Numeric validations
    if (!formData.monthlyRent || parseFloat(formData.monthlyRent) <= 0) {
      newErrors.monthlyRent = "Monthly rent must be greater than 0";
    }

    if (
      !formData.rentDueDay ||
      parseInt(formData.rentDueDay) < 1 ||
      parseInt(formData.rentDueDay) > 31
    ) {
      newErrors.rentDueDay = "Rent due day must be between 1 and 31";
    }

    if (formData.depositAmount && parseFloat(formData.depositAmount) <= 0) {
      newErrors.depositAmount = "Deposit amount must be greater than 0";
    }

    if (formData.securityDeposit && parseFloat(formData.securityDeposit) <= 0) {
      newErrors.securityDeposit = "Security deposit must be greater than 0";
    }

    // Date validations
    if (formData.leaseStartDate && formData.leaseEndDate) {
      const startDate = new Date(formData.leaseStartDate);
      const endDate = new Date(formData.leaseEndDate);

      if (endDate < startDate) {
        newErrors.leaseEndDate = "Lease end date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isEditing && parsedInitialData?.id) {
        await updateTenant.mutateAsync({
          id: parsedInitialData.id,
          propertyId: formData.propertyId ?? undefined,
          roomId: formData.roomId ?? undefined,
          monthlyRent: parseFloat(formData.monthlyRent),
          rentDueDay: parseInt(formData.rentDueDay),
          depositAmount: formData.depositAmount
            ? parseFloat(formData.depositAmount)
            : undefined,
          securityDeposit: formData.securityDeposit
            ? parseFloat(formData.securityDeposit)
            : undefined,
          emergencyContact: formData.emergencyContact ?? undefined,
          emergencyPhone: formData.emergencyPhone ?? undefined,
          moveInDate: formData.moveInDate
            ? new Date(formData.moveInDate)
            : undefined,
          leaseStartDate: formData.leaseStartDate
            ? new Date(formData.leaseStartDate)
            : undefined,
          leaseEndDate: formData.leaseEndDate
            ? new Date(formData.leaseEndDate)
            : undefined,
          remarks: formData.remarks ?? undefined,
          notes: formData.notes ?? undefined,
        });
      } else {
        await createTenant.mutateAsync({
          userId: formData.userId,
          propertyId: formData.propertyId,
          roomId: formData.roomId ?? undefined,
          monthlyRent: parseFloat(formData.monthlyRent),
          rentDueDay: parseInt(formData.rentDueDay),
          depositAmount: formData.depositAmount
            ? parseFloat(formData.depositAmount)
            : undefined,
          securityDeposit: formData.securityDeposit
            ? parseFloat(formData.securityDeposit)
            : undefined,
          emergencyContact: formData.emergencyContact ?? undefined,
          emergencyPhone: formData.emergencyPhone ?? undefined,
          moveInDate: formData.moveInDate
            ? new Date(formData.moveInDate)
            : undefined,
          leaseStartDate: formData.leaseStartDate
            ? new Date(formData.leaseStartDate)
            : undefined,
          leaseEndDate: formData.leaseEndDate
            ? new Date(formData.leaseEndDate)
            : undefined,
          remarks: formData.remarks ?? undefined,
          notes: formData.notes ?? undefined,
        });
      }
    } catch (error) {
      // Error is handled in the mutation callbacks
      console.error("Form submission error:", error);
    }
  };

  const handleCancel = () => {
    if (parsedInitialData?.id) {
      router.push(`/admin/tenants/${parsedInitialData.id}`);
    } else {
      router.push("/admin/tenants");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* User/Tenant */}
          <div>
            <label
              htmlFor="userId"
              className="block text-sm font-medium text-gray-700"
            >
              Tenant
            </label>
            <select
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.userId ? "border-red-500" : ""
              }`}
              disabled={isLoading || isLoadingUsers || isEditing || !!userId}
            >
              <option value="">Select a tenant</option>
              {parsedUsers
                .filter(
                  (
                    user: User & {
                      tenantProfile: { property: Property; room: Room };
                    },
                  ) => !user.tenantProfile,
                ) // Only show users without tenant profiles
                .map(
                  (
                    user: User & {
                      tenantProfile: { property: Property; room: Room };
                    },
                  ) => (
                    <option key={user.id} value={user.id}>
                      {user.name ?? user.email ?? user.id}
                    </option>
                  ),
                )}
            </select>
            {errors.userId && (
              <p className="mt-1 text-sm text-red-600">{errors.userId}</p>
            )}
          </div>

          {/* Property */}
          <div>
            <label
              htmlFor="propertyId"
              className="block text-sm font-medium text-gray-700"
            >
              Property
            </label>
            <select
              id="propertyId"
              name="propertyId"
              value={formData.propertyId}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.propertyId ? "border-red-500" : ""
              }`}
              disabled={isLoading || isLoadingProperties || !!propertyId}
            >
              <option value="">Select a property</option>
              {parsedProperties.map((property: Property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
            {errors.propertyId && (
              <p className="mt-1 text-sm text-red-600">{errors.propertyId}</p>
            )}
          </div>

          {/* Room */}
          <div>
            <label
              htmlFor="roomId"
              className="block text-sm font-medium text-gray-700"
            >
              Room (Optional)
            </label>
            <select
              id="roomId"
              name="roomId"
              value={formData.roomId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={
                isLoading || isLoadingRooms || !selectedPropertyId || !!roomId
              }
            >
              <option value="">No room assigned</option>
              {parsedRooms.map((room: Room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          {/* Monthly Rent */}
          <div>
            <label
              htmlFor="monthlyRent"
              className="block text-sm font-medium text-gray-700"
            >
              Monthly Rent ($)
            </label>
            <input
              type="number"
              id="monthlyRent"
              name="monthlyRent"
              value={formData.monthlyRent}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.monthlyRent ? "border-red-500" : ""
              }`}
              disabled={isLoading}
            />
            {errors.monthlyRent && (
              <p className="mt-1 text-sm text-red-600">{errors.monthlyRent}</p>
            )}
          </div>

          {/* Rent Due Day */}
          <div>
            <label
              htmlFor="rentDueDay"
              className="block text-sm font-medium text-gray-700"
            >
              Rent Due Day
            </label>
            <input
              type="number"
              id="rentDueDay"
              name="rentDueDay"
              value={formData.rentDueDay}
              onChange={handleChange}
              min="1"
              max="31"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.rentDueDay ? "border-red-500" : ""
              }`}
              disabled={isLoading}
            />
            {errors.rentDueDay && (
              <p className="mt-1 text-sm text-red-600">{errors.rentDueDay}</p>
            )}
          </div>

          {/* Deposit Amount */}
          <div>
            <label
              htmlFor="depositAmount"
              className="block text-sm font-medium text-gray-700"
            >
              Deposit Amount ($) (Optional)
            </label>
            <input
              type="number"
              id="depositAmount"
              name="depositAmount"
              value={formData.depositAmount}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.depositAmount ? "border-red-500" : ""
              }`}
              disabled={isLoading}
            />
            {errors.depositAmount && (
              <p className="mt-1 text-sm text-red-600">
                {errors.depositAmount}
              </p>
            )}
          </div>

          {/* Security Deposit */}
          <div>
            <label
              htmlFor="securityDeposit"
              className="block text-sm font-medium text-gray-700"
            >
              Security Deposit ($) (Optional)
            </label>
            <input
              type="number"
              id="securityDeposit"
              name="securityDeposit"
              value={formData.securityDeposit}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.securityDeposit ? "border-red-500" : ""
              }`}
              disabled={isLoading}
            />
            {errors.securityDeposit && (
              <p className="mt-1 text-sm text-red-600">
                {errors.securityDeposit}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lease Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Lease Information</h3>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Move In Date */}
          <div>
            <label
              htmlFor="moveInDate"
              className="block text-sm font-medium text-gray-700"
            >
              Move In Date (Optional)
            </label>
            <input
              type="date"
              id="moveInDate"
              name="moveInDate"
              value={formData.moveInDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoading}
            />
          </div>

          {/* Lease Start Date */}
          <div>
            <label
              htmlFor="leaseStartDate"
              className="block text-sm font-medium text-gray-700"
            >
              Lease Start Date (Optional)
            </label>
            <input
              type="date"
              id="leaseStartDate"
              name="leaseStartDate"
              value={formData.leaseStartDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoading}
            />
          </div>

          {/* Lease End Date */}
          <div>
            <label
              htmlFor="leaseEndDate"
              className="block text-sm font-medium text-gray-700"
            >
              Lease End Date (Optional)
            </label>
            <input
              type="date"
              id="leaseEndDate"
              name="leaseEndDate"
              value={formData.leaseEndDate}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.leaseEndDate ? "border-red-500" : ""
              }`}
              disabled={isLoading}
            />
            {errors.leaseEndDate && (
              <p className="mt-1 text-sm text-red-600">{errors.leaseEndDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Emergency Contact */}
          <div>
            <label
              htmlFor="emergencyContact"
              className="block text-sm font-medium text-gray-700"
            >
              Emergency Contact Name (Optional)
            </label>
            <input
              type="text"
              id="emergencyContact"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoading}
            />
          </div>

          {/* Emergency Phone */}
          <div>
            <label
              htmlFor="emergencyPhone"
              className="block text-sm font-medium text-gray-700"
            >
              Emergency Contact Phone (Optional)
            </label>
            <input
              type="tel"
              id="emergencyPhone"
              name="emergencyPhone"
              value={formData.emergencyPhone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Additional Information
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-6">
          {/* Remarks */}
          <div>
            <label
              htmlFor="remarks"
              className="block text-sm font-medium text-gray-700"
            >
              Remarks (Optional)
            </label>
            <textarea
              id="remarks"
              name="remarks"
              rows={3}
              value={formData.remarks}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoading}
              placeholder="Public remarks visible to the tenant"
            />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
              Admin Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoading}
              placeholder="Private notes for admin use only"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          disabled={isLoading}
        >
          {isLoading
            ? "Saving..."
            : isEditing
              ? "Update Tenant"
              : "Create Tenant"}
        </button>
      </div>
    </form>
  );
}
