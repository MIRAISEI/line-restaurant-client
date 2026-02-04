"use client";

import { useEffect, useState } from "react";
import { getUsers, updateUser, deleteUser, type User, type UserRole } from "@/lib/admin-api";
import { useAuth } from "@/lib/auth-context";
import AddUserModal from "./AddUserModal";

export default function UserTable() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Check if current user has admin or manager role
  const canManageUsers = currentUser?.role === "admin" || currentUser?.role === "manager";

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const handleRefresh = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to refresh users:", error);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const userId = user._id;
      if (!userId) {
        console.error("Invalid user: missing ID");
        return;
      }
      await updateUser(userId, { isActive: !user.isActive });
      handleRefresh();
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  const handleRoleChange = async (user: User, newRole: UserRole) => {
    try {
      const userId = user._id;
      if (!userId) {
        console.error("Invalid user: missing ID");
        return;
      }
      await updateUser(userId, { role: newRole });
      handleRefresh();
    } catch (error) {
      console.error("Failed to update user role:", error);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
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

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.displayName}"?`)) {
      return;
    }
    try {
      const userId = user._id;
      if (!userId) {
        console.error("Invalid user: missing ID");
        alert("Error: Invalid user ID");
        return;
      }
      await deleteUser(userId);
      // Refresh the users list after deletion
      await handleRefresh();
    } catch (error) {
      console.error("Failed to delete user:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete user. Please try again.";
      alert(`Error: ${errorMessage}`);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "Never";
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour ago`;
    return `${Math.floor(diffInSeconds / 86400)} day ago`;
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-12">
        <div className="text-center">
          <div className="inline-block relative mb-4">
            <div className="w-16 h-16 border-4 border-[#06C755]/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 font-medium text-lg">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 pl-12 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
            className="w-full rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 text-base font-medium text-gray-900 shadow-sm focus:border-[#06C755] focus:ring-2 focus:ring-[#06C755]/20 focus:outline-none transition-all duration-200 min-h-[48px] touch-manipulation hover:border-gray-300"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        </div>
        {canManageUsers && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#06C755] to-[#00C300] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[48px] flex items-center justify-center gap-2"
          >
            <span>+</span>
            <span>Add User</span>
          </button>
        )}
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-12">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-4xl">
              👥
            </div>
            <p className="text-xl font-bold text-gray-900 mb-2">No users found</p>
            <p className="text-gray-500">
              {searchQuery ? "Try adjusting your search query" : "Users will appear here when they place orders"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Total Orders
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Last Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user._id || `user-${index}`}
                    className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 transition-all duration-200 group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#06C755] to-[#00C300] flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-base font-bold text-gray-900">
                            {user.displayName}
                          </div>
                          {user.email && (
                            <div className="text-sm text-gray-600 font-medium">{user.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                        {user.userId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-gray-900">
                        {user.totalOrders}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-gray-900">
                        ¥{user.totalSpent.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatTimeAgo(user.lastOrderDate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(user.lastOrderDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canManageUsers ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#06C755]/20 cursor-pointer ${getRoleBadgeColor(user.role)}`}
                        >
                          <option value="customer">Customer</option>
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 ${getRoleBadgeColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canManageUsers ? (
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 shadow-sm transition-all duration-200 active:scale-95 touch-manipulation ${
                            user.isActive
                              ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                              : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </button>
                      ) : (
                        <span className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 ${
                          user.isActive
                            ? "bg-green-100 text-green-700 border-green-300"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canManageUsers && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(user)}
                            className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation min-h-[40px] border border-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}


