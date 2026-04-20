"use client";

import { useState } from "react";
import type { User } from "@/lib/admin-api";

const DEFAULT_PROFILE: User = {
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
};

export default function ProfilePage() {
  const [user, setUser] = useState<User>(DEFAULT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: DEFAULT_PROFILE.displayName,
    email: DEFAULT_PROFILE.email || "",
    phone: DEFAULT_PROFILE.phone || "",
  });
  const [success, setSuccess] = useState<string | null>(null);

  const handleEdit = () => {
    setIsEditing(true);
    setSuccess(null);
  };

  const handleCancel = () => {
    setFormData({
      displayName: user.displayName,
      email: user.email || "",
      phone: user.phone || "",
    });
    setIsEditing(false);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...user,
      displayName: formData.displayName.trim() || user.displayName,
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    setUser(updatedUser);
    setIsEditing(false);
    setSuccess("Profile updated locally.");
  };

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

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 bg-gradient-to-r from-[#06C755] via-[#00C300] to-[#06C755] bg-clip-text text-transparent drop-shadow-lg">
            My Profile
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-medium">
            Manage the local admin profile
          </p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-6 md:p-8">
        {success && (
          <div className="mb-6 bg-green-100 border-2 border-green-300 text-green-700 px-4 py-3 rounded-xl font-bold">
            {success}
          </div>
        )}

        {!isEditing ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-6 border-b-2 border-gray-200">
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-[#06C755] to-[#00C300] flex items-center justify-center text-white font-bold text-4xl md:text-5xl shadow-lg">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {user.displayName}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-4 py-2 text-sm font-bold rounded-lg border-2 ${getRoleBadgeColor(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  <span className={`px-4 py-2 text-sm font-bold rounded-full border-2 ${user.isActive ? "bg-green-100 text-green-700 border-green-300" : "bg-gray-100 text-gray-700 border-gray-300"}`}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleEdit}
                className="px-6 py-3 bg-gradient-to-r from-[#06C755] to-[#00C300] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[48px] flex items-center gap-2"
              >
                <span>Edit Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileField label="User ID" value={user.userId} />
              <ProfileField label="Display Name" value={user.displayName} />
              <ProfileField label="Email" value={user.email || "Not set"} />
              <ProfileField label="Phone" value={user.phone || "Not set"} />
              <ProfileField label="Total Orders" value={String(user.totalOrders)} />
              <ProfileField label="Total Spent" value={`¥${user.totalSpent.toLocaleString()}`} />
              <ProfileField label="Member Since" value={new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
              <ProfileField label="Last Order" value={user.lastOrderDate ? new Date(user.lastOrderDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "No orders yet"} />
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
                  className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
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
                  className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
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
                  className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 md:py-3.5 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all duration-200 active:scale-95 touch-manipulation min-h-[48px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-[#06C755] to-[#00C300] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[48px]"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
      <label className="block text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
        {label}
      </label>
      <p className="text-lg text-gray-900 bg-white px-4 py-3 rounded-xl">
        {value}
      </p>
    </div>
  );
}
