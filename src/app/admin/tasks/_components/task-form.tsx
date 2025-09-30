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

interface TaskFormProps {
  initialData?: string;
  propertyId?: string;
  roomId?: string;
  userId?: string;
  isEditing?: boolean;
}

export function TaskForm({
  initialData,
  propertyId,
  roomId,
  userId,
  isEditing = false,
}: TaskFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const parsedInitialData = initialData ? JSON.parse(initialData) : null;
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    parsedInitialData?.propertyId ?? propertyId ?? "",
  );
  const [selectedFrequency, setSelectedFrequency] = useState<string>(
    parsedInitialData?.frequency ?? "ONCE",
  );
  const [assignToSpecific, setAssignToSpecific] = useState<boolean>(
    userId ? true : parsedInitialData ? !parsedInitialData.assignToAll : false,
  );

  const [useRotation, setUseRotation] = useState<boolean>(
    parsedInitialData?.useRotation ?? false,
  );

  const [formData, setFormData] = useState({
    title: parsedInitialData?.title ?? "",
    description: parsedInitialData?.description ?? "",
    propertyId: parsedInitialData?.propertyId ?? propertyId ?? "",
    roomId: parsedInitialData?.roomId ?? roomId ?? "",
    frequency: parsedInitialData?.frequency ?? "ONCE",
    intervalDays: parsedInitialData?.intervalDays?.toString() ?? "",
    estimatedDuration: parsedInitialData?.estimatedDuration?.toString() ?? "",
    priority: parsedInitialData?.priority?.toString() ?? "1",
    assignToAll: parsedInitialData?.assignToAll ?? false,
    useRotation: parsedInitialData?.useRotation ?? false,
    maxAssignments: parsedInitialData?.maxAssignments?.toString() ?? "",
    isActive: parsedInitialData?.isActive ?? true,
    startDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    userIds: userId
      ? [userId]
      : parsedInitialData?.assignments
        ? parsedInitialData.assignments.map(
            (a: { user: { id: string } }) => a.user.id,
          )
        : [],
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
  const { data: tenants, isLoading: isLoadingTenants } =
    api.tenant.getAll.useQuery();

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

  const parsedTenants = Array.isArray(tenants)
    ? tenants
    : typeof tenants === "string"
      ? JSON.parse(tenants)
      : [];

  // API mutations
  const createTask = api.task.create.useMutation({
    onSuccess: () => {
      toast.success("Task created successfully");
      router.push("/admin/tasks");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  const updateTask = api.task.update.useMutation({
    onSuccess: () => {
      toast.success("Task updated successfully");
      if (parsedInitialData?.id) {
        router.push(`/admin/tasks/${parsedInitialData.id}`);
      } else {
        router.push("/admin/tasks");
      }
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  const updateAssignments = api.task.updateAssignments.useMutation({
    onSuccess: () => {
      // This will be called after updateTask succeeds
      if (parsedInitialData?.id) {
        router.push(`/admin/tasks/${parsedInitialData.id}`);
      } else {
        router.push("/admin/tasks");
      }
      router.refresh();
    },
    onError: (error) => {
      toast.error("Task updated but assignments failed: " + error.message);
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

  // Update interval days visibility based on frequency
  useEffect(() => {
    if (selectedFrequency !== formData.frequency) {
      setFormData((prev) => ({
        ...prev,
        frequency: selectedFrequency,
      }));
    }
  }, [selectedFrequency, formData.frequency]);

  // Form handlers
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    // Handle property selection specially to update available rooms
    if (name === "propertyId") {
      setSelectedPropertyId(value);
    }

    // Handle frequency selection
    if (name === "frequency") {
      setSelectedFrequency(value);
    }

    // Handle checkbox inputs
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;

      // Special handling for useRotation checkbox
      if (name === "useRotation") {
        setUseRotation(checked);
      }

      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle user selection
  const handleUserSelection = (userId: string, isSelected: boolean) => {
    setFormData((prev) => {
      const currentUserIds = prev.userIds ?? [];

      if (isSelected) {
        return { ...prev, userIds: [...currentUserIds, userId] };
      } else {
        return {
          ...prev,
          userIds: currentUserIds.filter((id: string) => id !== userId),
        };
      }
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!formData.title) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 2) {
      newErrors.title = "Title must be at least 2 characters";
    }

    // Property validation
    if (!formData.propertyId) {
      newErrors.propertyId = "Property is required";
    }

    // Frequency validation
    if (formData.frequency === "CUSTOM" && !formData.intervalDays) {
      newErrors.intervalDays = "Interval days is required for custom frequency";
    }

    // User assignment validation
    if (
      assignToSpecific &&
      (!formData.userIds || formData.userIds.length === 0)
    ) {
      newErrors.userIds = "Please select at least one tenant";
    }

    // Date validation
    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    } else {
      const startDate = new Date(formData.startDate ?? "");
      const dueDate = new Date(formData.dueDate);

      if (dueDate < startDate) {
        newErrors.dueDate = "Due date must be after start date";
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
        // First update the task
        await updateTask.mutateAsync({
          id: parsedInitialData.id,
          title: formData.title,
          description: formData.description ?? undefined,
          roomId: formData.roomId ?? undefined,
          frequency: formData.frequency as
            | "ONCE"
            | "DAILY"
            | "WEEKLY"
            | "MONTHLY"
            | "CUSTOM",
          intervalDays: formData.intervalDays
            ? parseInt(formData.intervalDays)
            : undefined,
          estimatedDuration: formData.estimatedDuration
            ? parseInt(formData.estimatedDuration)
            : undefined,
          priority: parseInt(formData.priority),
          assignToAll: !assignToSpecific,
          useRotation: useRotation && assignToSpecific,
          maxAssignments: formData.maxAssignments
            ? parseInt(formData.maxAssignments)
            : undefined,
          isActive: formData.isActive,
        });

        // Then update the assignments if needed
        if (assignToSpecific) {
          await updateAssignments.mutateAsync({
            taskId: parsedInitialData.id,
            userIds: formData.userIds,
          });
        }
      } else {
        await createTask.mutateAsync({
          title: formData.title,
          description: formData.description ?? undefined,
          propertyId: formData.propertyId,
          roomId: formData.roomId ?? undefined,
          frequency: formData.frequency as
            | "ONCE"
            | "DAILY"
            | "WEEKLY"
            | "MONTHLY"
            | "CUSTOM",
          intervalDays: formData.intervalDays
            ? parseInt(formData.intervalDays)
            : undefined,
          estimatedDuration: formData.estimatedDuration
            ? parseInt(formData.estimatedDuration)
            : undefined,
          priority: parseInt(formData.priority),
          assignToAll: !assignToSpecific,
          useRotation: useRotation && assignToSpecific,
          maxAssignments: formData.maxAssignments
            ? parseInt(formData.maxAssignments)
            : undefined,
          userIds: assignToSpecific ? formData.userIds : undefined,
          startDate: new Date(formData.startDate ?? new Date().toISOString()),
          dueDate: new Date(formData.dueDate ?? new Date().toISOString()),
        });
      }
    } catch (error) {
      // Error is handled in the mutation callbacks
      console.error("Form submission error:", error);
    }
  };

  const handleCancel = () => {
    if (parsedInitialData?.id) {
      router.push(`/admin/tasks/${parsedInitialData.id}`);
    } else {
      router.push("/admin/tasks");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Task Information</h3>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Title */}
          <div className="sm:col-span-2">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Task Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.title ? "border-red-500" : ""
              }`}
              disabled={isLoading}
              placeholder="e.g. Clean Kitchen"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoading}
              placeholder="Detailed instructions for the task..."
            />
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
              disabled={
                isLoading || isLoadingProperties || isEditing || !!propertyId
              }
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
              Room/Area (Optional)
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
              <option value="">No specific room (entire property)</option>
              {parsedRooms.map((room: Room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700"
            >
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoading}
            >
              <option value="1">Low</option>
              <option value="2">Medium-Low</option>
              <option value="3">Medium</option>
              <option value="4">Medium-High</option>
              <option value="5">High</option>
            </select>
          </div>

          {/* Estimated Duration */}
          <div>
            <label
              htmlFor="estimatedDuration"
              className="block text-sm font-medium text-gray-700"
            >
              Estimated Duration (minutes, optional)
            </label>
            <input
              type="number"
              id="estimatedDuration"
              name="estimatedDuration"
              value={formData.estimatedDuration}
              onChange={handleChange}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoading}
              placeholder="e.g. 30"
            />
          </div>
        </div>
      </div>

      {/* Schedule Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Schedule</h3>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Frequency */}
          <div>
            <label
              htmlFor="frequency"
              className="block text-sm font-medium text-gray-700"
            >
              Frequency
            </label>
            <select
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoading}
            >
              <option value="ONCE">One-time</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          {/* Interval Days (only for CUSTOM frequency) */}
          {selectedFrequency === "CUSTOM" && (
            <div>
              <label
                htmlFor="intervalDays"
                className="block text-sm font-medium text-gray-700"
              >
                Interval Days
              </label>
              <input
                type="number"
                id="intervalDays"
                name="intervalDays"
                value={formData.intervalDays}
                onChange={handleChange}
                min="1"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.intervalDays ? "border-red-500" : ""
                }`}
                disabled={isLoading}
                placeholder="e.g. 3 (every 3 days)"
              />
              {errors.intervalDays && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.intervalDays}
                </p>
              )}
            </div>
          )}

          {/* Start Date */}
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={isLoading || isEditing}
            />
          </div>

          {/* Due Date */}
          <div>
            <label
              htmlFor="dueDate"
              className="block text-sm font-medium text-gray-700"
            >
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.dueDate ? "border-red-500" : ""
              }`}
              disabled={isLoading || isEditing}
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Assignment</h3>
        <div className="mt-4 space-y-4">
          {/* Assignment Type */}
          <div className="flex items-center space-x-4">
            <label className="block text-sm font-medium text-gray-700">
              Assignment Type:
            </label>
            <div className="flex items-center">
              <input
                type="radio"
                id="assignToAll"
                name="assignmentType"
                checked={!assignToSpecific}
                onChange={() => setAssignToSpecific(false)}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading || (!!userId && !isEditing)}
              />
              <label
                htmlFor="assignToAll"
                className="ml-2 block text-sm text-gray-700"
              >
                Assign to all tenants (rotation)
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="assignToSpecific"
                name="assignmentType"
                checked={assignToSpecific}
                onChange={() => setAssignToSpecific(true)}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading || (!!userId && !isEditing)}
              />
              <label
                htmlFor="assignToSpecific"
                className="ml-2 block text-sm text-gray-700"
              >
                Assign to specific tenants
              </label>
            </div>
          </div>

          {/* Max Assignments (only for assignToAll) */}
          {!assignToSpecific && (
            <div>
              <label
                htmlFor="maxAssignments"
                className="block text-sm font-medium text-gray-700"
              >
                Maximum Concurrent Assignments (Optional)
              </label>
              <input
                type="number"
                id="maxAssignments"
                name="maxAssignments"
                value={formData.maxAssignments}
                onChange={handleChange}
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={isLoading}
                placeholder="Leave blank for no limit"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum number of tenants who can be assigned this task at once
              </p>
            </div>
          )}

          {/* Rotation Option (only for assignToSpecific) */}
          {assignToSpecific && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useRotation"
                name="useRotation"
                checked={useRotation}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <label
                htmlFor="useRotation"
                className="ml-2 block text-sm text-gray-700"
              >
                Rotate task among selected tenants
              </label>
              <span className="ml-2 text-xs text-gray-500">
                (When a tenant completes this task, it will be assigned to the
                next tenant in the list)
              </span>
            </div>
          )}

          {/* Tenant Selection (only for assignToSpecific) */}
          {assignToSpecific && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Tenants
              </label>
              <div
                className={`mt-2 max-h-60 overflow-y-auto rounded-md border border-gray-300 p-2 ${
                  errors.userIds ? "border-red-500" : ""
                }`}
              >
                {isLoadingTenants ? (
                  <div className="py-2 text-center text-sm text-gray-500">
                    Loading tenants...
                  </div>
                ) : parsedTenants.length > 0 ? (
                  parsedTenants
                    .filter(
                      (tenant: {
                        propertyId: string;
                        roomId?: string | null;
                      }) => {
                        // Filter by property if selected
                        if (formData.propertyId) {
                          return tenant.propertyId === formData.propertyId;
                        }
                        return true;
                      },
                    )
                    .filter(
                      (tenant: {
                        propertyId: string;
                        roomId?: string | null;
                      }) => {
                        // Filter by room if selected
                        if (formData.roomId) {
                          return tenant.roomId === formData.roomId;
                        }
                        return true;
                      },
                    )
                    .map(
                      (tenant: {
                        id: string;
                        userId: string;
                        user: { name: string | null; email: string | null };
                        room?: { name: string } | null;
                      }) => (
                        <div key={tenant.id} className="flex items-center py-2">
                          <input
                            type="checkbox"
                            id={`tenant-${tenant.userId}`}
                            checked={formData.userIds.includes(tenant.userId)}
                            onChange={(e) =>
                              handleUserSelection(
                                tenant.userId,
                                e.target.checked,
                              )
                            }
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            disabled={isLoading || userId === tenant.userId}
                          />
                          <label
                            htmlFor={`tenant-${tenant.userId}`}
                            className="ml-3 block text-sm text-gray-700"
                          >
                            {tenant.user.name ??
                              tenant.user.email ??
                              tenant.userId}
                            {tenant.room && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({tenant.room.name})
                              </span>
                            )}
                          </label>
                        </div>
                      ),
                    )
                ) : (
                  <div className="py-2 text-center text-sm text-gray-500">
                    No tenants found for the selected property/room
                  </div>
                )}
              </div>
              {errors.userIds && (
                <p className="mt-1 text-sm text-red-600">{errors.userIds}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status (only for editing) */}
      {isEditing && (
        <div>
          <h3 className="text-lg font-medium text-gray-900">Status</h3>
          <div className="mt-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <label
                htmlFor="isActive"
                className="ml-2 block text-sm text-gray-700"
              >
                Task is active
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Inactive tasks will not be assigned to new tenants
            </p>
          </div>
        </div>
      )}

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
          {isLoading ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
        </button>
      </div>
    </form>
  );
}
