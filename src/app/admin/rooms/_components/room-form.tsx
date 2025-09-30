"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { api } from "~/trpc/react";

interface Property {
  id: string;
  name: string;
}

interface RoomFormProps {
  initialData?: {
    id: string;
    name: string;
    propertyId: string;
    description?: string | null;
  };
  propertyId?: string;
  isEditing?: boolean;
}

export function RoomForm({
  initialData,
  propertyId,
  isEditing = false,
}: RoomFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    propertyId: initialData?.propertyId || propertyId || "",
    description: initialData?.description || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch properties for dropdown
  const { data: properties, isLoading: isLoadingProperties } =
    api.property.getAll.useQuery();

  // Parse properties data if it's a string (due to serialization)
  const parsedProperties = Array.isArray(properties)
    ? properties
    : typeof properties === "string"
      ? JSON.parse(properties)
      : [];

  // API mutations
  const createRoom = api.room.create.useMutation({
    onSuccess: () => {
      toast.success("Room created successfully");
      if (formData.propertyId) {
        router.push(`/admin/properties/${formData.propertyId}`);
      } else {
        router.push("/admin/rooms");
      }
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  const updateRoom = api.room.update.useMutation({
    onSuccess: () => {
      toast.success("Room updated successfully");
      if (initialData?.id) {
        router.push(`/admin/rooms/${initialData.id}`);
      } else if (formData.propertyId) {
        router.push(`/admin/properties/${formData.propertyId}`);
      } else {
        router.push("/admin/rooms");
      }
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  // Form handlers
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Property validation
    if (!formData.propertyId) {
      newErrors.propertyId = "Property is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isEditing && initialData?.id) {
        await updateRoom.mutateAsync({
          id: initialData.id,
          name: formData.name,
          description: formData.description || null,
        });
      } else {
        await createRoom.mutateAsync({
          name: formData.name,
          propertyId: formData.propertyId,
          description: formData.description || undefined,
        });
      }
    } catch (error) {
      // Error is handled in the mutation callbacks
      console.error("Form submission error:", error);
    }
  };

  const handleCancel = () => {
    if (initialData?.id) {
      router.push(`/admin/rooms/${initialData.id}`);
    } else if (formData.propertyId) {
      router.push(`/admin/properties/${formData.propertyId}`);
    } else {
      router.push("/admin/rooms");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Room Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
              errors.name ? "border-red-500" : ""
            }`}
            disabled={isLoading}
            placeholder="e.g. Master Bedroom"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Property (only show if not editing) */}
        {!isEditing && (
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
        )}

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={isLoading}
            placeholder="Additional details about the room..."
          />
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
          {isLoading ? "Saving..." : isEditing ? "Update Room" : "Create Room"}
        </button>
      </div>
    </form>
  );
}
