"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { updateUser, getUserById } from "@/lib/admin-api";
import type { User } from "@/lib/admin-api";

export default function ProfilePage() {
  const { user: currentUser, refreshUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserProfile() {
      // If no authenticated user is available (auth removed for dev),
      // provide a sensible default admin user so the profile page still renders.
      if (!currentUser) {
        const defaultAdmin: User = {
          _id: "local-admin-0",
          userId: "admin",
          displayName: "Admin",
          email: "admin@example.com",
          phone: "",
          role: "admin",
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
        } as User;

        setUser(defaultAdmin);
        setFormData({
          displayName: defaultAdmin.displayName,
          email: defaultAdmin.email || "",
          phone: defaultAdmin.phone || "",
        });
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const userId = currentUser._id || currentUser.id; // AuthUser has both _id and id
        if (!userId) {
          setError("User ID not found");
          return;
        }
        
        const userData = await getUserById(userId);
        setUser(userData);
        setFormData({
          displayName: userData.displayName,
          email: userData.email || "",
          phone: userData.phone || "",
        });
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load profile information";
        setError(errorMessage);

        // If fetching the full User failed but we do have an authenticated
        // AuthUser (`currentUser`), fall back to a lightweight representation
        // so the profile page can still render instead of showing "User not found".
        if (currentUser) {
          const fallbackUser: User = {
            _id: currentUser._id || (currentUser.id as string) || "fallback-user",
            userId: currentUser.userId || "",
            displayName: currentUser.displayName || "User",
            email: currentUser.email,
            phone: currentUser.phone,
            role: currentUser.role as User["role"],
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: undefined,
            createdAt: currentUser.createdAt || new Date().toISOString(),
            updatedAt: currentUser.updatedAt || new Date().toISOString(),
            isActive: currentUser.isActive ?? true,
          } as User;

          setUser(fallbackUser);
          setFormData({
            displayName: fallbackUser.displayName,
            email: fallbackUser.email || "",
            phone: fallbackUser.phone || "",
          });
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [currentUser]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        displayName: user.displayName,
        email: user.email || "",
        phone: user.phone || "",
      });
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const userId = user._id;

      // If this is the local default admin (no backend), avoid calling the
      // API and just update local state so the user can see changes during
      // development without backend auth.
      if (userId && userId.startsWith("local-admin")) {
        const updatedUser: User = {
          ...user,
          displayName: formData.displayName.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          updatedAt: new Date().toISOString(),
        };

        setUser(updatedUser);
        setSuccess("Profile updated (local only)");
        setIsEditing(false);
      } else {
        const updatedUser = await updateUser(userId, {
          displayName: formData.displayName.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        });

        // Update user data with the response
        setUser(updatedUser);

        // Refresh auth context to update user data globally
        await refreshUser();

        setSuccess("Profile updated successfully!");
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block relative">
            <div className="w-16 h-16 border-4 border-[#31a354]/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#31a354] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show 'User not found' only when neither a fetched user nor an auth user exists.
  if (!user && !currentUser) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-bold text-gray-900">User not found</p>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "manager":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "staff":
        return "bg-indigo-100 text-indigo-700 border-indigo-300";
      case "customer":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };
  // Ensure we have a concrete User object for rendering (fallback to currentUser if needed)
  const displayUser: User | null = user ?? (currentUser
    ? ({
        _id: currentUser._id || (currentUser.id as string) || "fallback-user",
        userId: currentUser.userId || "",
        displayName: currentUser.displayName || "User",
        email: currentUser.email,
        phone: currentUser.phone,
        role: currentUser.role as User["role"],
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: undefined,
        createdAt: currentUser.createdAt || new Date().toISOString(),
        updatedAt: currentUser.updatedAt || new Date().toISOString(),
        isActive: currentUser.isActive ?? true,
      } as User)
    : null);

  if (!displayUser) return null;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 bg-gradient-to-r from-[#06C755] via-[#00C300] to-[#06C755] bg-clip-text text-transparent drop-shadow-lg">
            My Profile
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-medium">
            View and manage your profile information
          </p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-6 md:p-8">
        {error && (
          <div className="mb-6 bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl font-bold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-100 border-2 border-green-300 text-green-700 px-4 py-3 rounded-xl font-bold">
            {success}
          </div>
        )}

        {!isEditing ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-6 border-b-2 border-gray-200">
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-[#06C755] to-[#00C300] flex items-center justify-center text-white font-bold text-4xl md:text-5xl shadow-lg">
                {displayUser.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {displayUser.displayName}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-4 py-2 text-sm font-bold rounded-lg border-2 ${getRoleBadgeColor(displayUser.role)}`}>
                    {displayUser.role.charAt(0).toUpperCase() + displayUser.role.slice(1)}
                  </span>
                  <span className={`px-4 py-2 text-sm font-bold rounded-full border-2 ${
                    displayUser.isActive
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-gray-100 text-gray-700 border-gray-300"
                  }`}>
                    {displayUser.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleEdit}
                className="px-6 py-3 bg-gradient-to-r from-[#06C755] to-[#00C300] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[48px] flex items-center gap-2"
              >
                <span>✏️</span>
                <span>Edit Profile</span>
              </button>
            </div>

            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  User ID
                </label>
                  <p className="text-lg font-mono text-gray-900 bg-white px-4 py-3 rounded-xl">
                  {displayUser.userId}
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Display Name
                </label>
                <p className="text-lg font-bold text-gray-900 bg-white px-4 py-3 rounded-xl">
                  {displayUser.displayName}
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Email
                </label>
                <p className="text-lg text-gray-900 bg-white px-4 py-3 rounded-xl">
                  {displayUser.email || "Not set"}
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Phone
                </label>
                <p className="text-lg text-gray-900 bg-white px-4 py-3 rounded-xl">
                  {displayUser.phone || "Not set"}
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Total Orders
                </label>
                <p className="text-2xl font-bold text-gray-900 bg-white px-4 py-3 rounded-xl">
                  {displayUser.totalOrders}
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Total Spent
                </label>
                <p className="text-2xl font-bold text-gray-900 bg-white px-4 py-3 rounded-xl">
                  ¥{displayUser.totalSpent.toLocaleString()}
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Member Since
                </label>
                <p className="text-lg text-gray-900 bg-white px-4 py-3 rounded-xl">
                  {new Date(displayUser.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Last Order
                </label>
                <p className="text-lg text-gray-900 bg-white px-4 py-3 rounded-xl">
                  {displayUser.lastOrderDate
                    ? new Date(displayUser.lastOrderDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "No orders yet"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter display name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
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
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

