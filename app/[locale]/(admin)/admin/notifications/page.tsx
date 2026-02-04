"use client";

import { useEffect, useState } from "react";
import { getOrders } from "@/lib/admin-api";

interface Notification {
  id: string;
  type: "order_created" | "order_ready" | "order_completed";
  title: string;
  message: string;
  orderId?: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const ordersData = await getOrders();

        // Generate notifications from orders
        const generatedNotifications: Notification[] = [];

        // Recent orders (last 24 hours) - treat as new notifications
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        ordersData.forEach((order) => {
          const orderDate = new Date(order.createdAt);

          if (orderDate >= oneDayAgo) {
            generatedNotifications.push({
              id: `order-${order._id}`,
              type: "order_created",
              title: "New Order Received",
              message: `Order ${order.orderId} from Table ${order.tableNumber}`,
              orderId: order.orderId,
              timestamp: order.createdAt,
              read: false,
            });
          }

          // If order is ready, add ready notification
          if (order.status === "Ready") {
            const readyDate = new Date(order.updatedAt);
            if (readyDate >= oneDayAgo) {
              generatedNotifications.push({
                id: `ready-${order._id}`,
                type: "order_ready",
                title: "Order Ready",
                message: `Order ${order.orderId} is ready for pickup`,
                orderId: order.orderId,
                timestamp: order.updatedAt,
                read: false,
              });
            }
          }

          // If order is completed, add completed notification
          if (order.status === "Completed") {
            const completedDate = new Date(order.updatedAt);
            if (completedDate >= oneDayAgo) {
              generatedNotifications.push({
                id: `completed-${order._id}`,
                type: "order_completed",
                title: "Order Completed",
                message: `Order ${order.orderId} has been completed`,
                orderId: order.orderId,
                timestamp: order.updatedAt,
                read: false,
              });
            }
          }
        });

        // Sort by timestamp (newest first)
        generatedNotifications.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setNotifications(generatedNotifications);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayedNotifications = filter === "unread"
    ? notifications.filter(n => !n.read)
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order_created":
        return "📋";
      case "order_ready":
        return "✅";
      case "order_completed":
        return "🎉";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "order_created":
        return "from-blue-500 to-cyan-500";
      case "order_ready":
        return "from-green-500 to-emerald-500";
      case "order_completed":
        return "from-purple-500 to-pink-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour ago`;
    return `${Math.floor(diffInSeconds / 86400)} day ago`;
  };

  return (
    <div className="pb-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-3 bg-gradient-to-r from-[#31a354] via-[#31a354] to-[#31a354] bg-clip-text text-transparent drop-shadow-lg">
            Notifications
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-medium">
            Stay updated with order activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-gradient-to-r from-[#31a354] to-[#00C300] text-white rounded-xl font-bold transition-all duration-200 active:scale-95 touch-manipulation min-h-[44px] flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <span>✓</span>
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3">
        <button
          onClick={() => setFilter("all")}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 active:scale-95 touch-manipulation min-h-[48px] ${filter === "all"
            ? "bg-gradient-to-r from-[#31a354] to-[#00C300] text-white shadow-lg"
            : "bg-white/80 text-gray-700 hover:bg-white/90 border border-white/50"
            }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 active:scale-95 touch-manipulation min-h-[48px] relative ${filter === "unread"
            ? "bg-gradient-to-r from-[#31a354] to-[#00C300] text-white shadow-lg"
            : "bg-white/80 text-gray-700 hover:bg-white/90 border border-white/50"
            }`}
        >
          Unread ({unreadCount})
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center text-gray-500 py-20">
          <div className="inline-block relative">
            <div className="w-16 h-16 border-4 border-[#31a354]/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#31a354] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium text-lg">Loading notifications...</p>
        </div>
      ) : displayedNotifications.length === 0 ? (
        <div className="text-center py-20 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-4xl">
            🔔
          </div>
          <p className="text-xl font-bold text-gray-900 mb-2">No notifications</p>
          <p className="text-gray-500">
            {filter === "unread" ? "All notifications have been read" : "You're all caught up!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedNotifications.map((notification, index) => (
            <div
              key={notification.id}
              className={`bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border-2 border-white/50 p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${!notification.read ? "ring-2 ring-[#31a354]/20" : ""
                }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${getNotificationColor(notification.type)} flex items-center justify-center text-3xl shadow-lg`}>
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{notification.title}</h3>
                        {!notification.read && (
                          <span className="h-2 w-2 bg-[#31a354] rounded-full"></span>
                        )}
                      </div>
                      <p className="text-base text-gray-600 mb-3">{notification.message}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 font-medium">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                        {notification.orderId && (
                          <span className="text-sm font-bold text-[#31a354]">
                            Order: {notification.orderId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-200 active:scale-95 touch-manipulation min-h-[40px] text-sm"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

