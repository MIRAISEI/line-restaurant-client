"use client";

import { useState } from "react";
import { createUser, type UserRole } from "@/lib/admin-api";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUserModal({
  isOpen,
  onClose,
  onSuccess,
}: AddUserModalProps) {
  const [formData, setFormData] = useState({
    userId: "",
    displayName: "",
    email: "",
    phone: "",
    role: "customer" as UserRole,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles: UserRole[] = ["customer", "staff", "manager", "admin"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.userId.trim() || !formData.displayName.trim()) {
        setError("User ID and Display Name are required");
        setIsSubmitting(false);
        return;
      }

      // Create user
      await createUser({
        userId: formData.userId.trim(),
        displayName: formData.displayName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        isActive: true,
      });

      // Reset form
      setFormData({
        userId: "",
        displayName: "",
        email: "",
        phone: "",
        role: "customer",
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to create user:", err);
      // Display the actual error message from the API
      const errorMessage = err instanceof Error ? err.message : "Failed to create user. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        userId: "",
        displayName: "",
        email: "",
        phone: "",
        role: "customer",
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-md touch-manipulation"
      onClick={handleClose}
    >
      <div
        className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-white/50 backdrop-blur-sm touch-manipulation"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#06C755] via-[#00C300] to-[#06C755] px-6 md:px-8 py-6 md:py-7 flex items-center justify-between rounded-t-3xl shadow-lg z-10 min-h-[80px]">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
              Add New User
            </h2>
            <p className="text-base md:text-lg text-white/95 mt-2 font-medium">
              Create a new user account
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white/90 active:text-white transition-all duration-200 p-3 md:p-4 active:bg-white/30 rounded-full backdrop-blur-sm min-w-[48px] min-h-[48px] md:min-w-[56px] md:min-h-[56px] flex items-center justify-center touch-manipulation disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg
              className="w-7 h-7 md:w-8 md:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-bold">
                {error}
              </div>
            )}

            {/* User ID */}
            <div>
              <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                User ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.userId}
                onChange={(e) =>
                  setFormData({ ...formData, userId: e.target.value })
                }
                required
                className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
                placeholder="e.g., user001"
              />
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                required
                className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
                placeholder="e.g., John Doe"
              />
            </div>

            {/* Email and Phone Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
                  placeholder="user@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as UserRole })
                }
                required
                className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4 border-t-2 border-white/50">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all duration-200 active:scale-95 touch-manipulation min-h-[48px] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-[#06C755] to-[#00C300] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[48px] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Create User</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}













