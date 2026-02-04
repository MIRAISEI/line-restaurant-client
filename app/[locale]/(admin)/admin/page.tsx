"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getOrders, type Order } from "@/lib/admin-api";

export default function AdminDashboard() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  // Calculate stats from orders
  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === "Received").length,
    preparingOrders: orders.filter((o) => o.status === "Preparing").length,
    readyOrders: orders.filter((o) => o.status === "Ready").length,
    completedOrders: orders.filter((o) => o.status === "Completed").length,
    totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
  };

  // Get recent orders (last 3)
  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Format time ago
  function getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return locale === 'ja' ? `${diffInSeconds}秒前` : `${diffInSeconds} sec ago`;
    if (diffInSeconds < 3600) return locale === 'ja' ? `${Math.floor(diffInSeconds / 60)}分前` : `${Math.floor(diffInSeconds / 60)} min ago`;
    return locale === 'ja' ? `${Math.floor(diffInSeconds / 3600)}時間前` : `${Math.floor(diffInSeconds / 3600)} hour ago`;
  }

  // Calculate completion rate
  const completionRate = stats.totalOrders > 0
    ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
    : 0;

  // Calculate average order value
  const averageOrderValue = stats.totalOrders > 0
    ? Math.round(stats.totalRevenue / stats.totalOrders)
    : 0;

  return (
    <>
      <div className="pb-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
          <div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-3 bg-gradient-to-r from-[#31a354] via-[#31a354] to-[#31a354] bg-clip-text text-transparent drop-shadow-lg">
              {t('dashboard')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 font-medium">
              {t('welcomeBack')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-5 py-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('today')}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {new Date().toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', { weekday: "long", month: "short", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title={t('stats.totalOrders')}
            value={stats.totalOrders}
            icon="📋"
            gradient="from-[#31a354] to-[#31a354]"
            bgGradient="from-green-50 via-emerald-50 to-teal-50"
            trend="+12%"
            trendUp={true}
          />
          <SummaryCard
            title={t('stats.pending')}
            value={stats.pendingOrders}
            icon="⏳"
            gradient="from-[#FFB800] to-[#FF9500]"
            bgGradient="from-yellow-50 via-amber-50 to-orange-50"
            subtitle={`${stats.totalOrders > 0 ? Math.round((stats.pendingOrders / stats.totalOrders) * 100) : 0}% ${locale === 'ja' ? '全体の割合' : 'of total'}`}
          />
          <SummaryCard
            title={t('stats.preparing')}
            value={stats.preparingOrders}
            icon="👨‍🍳"
            gradient="from-[#FF6B6B] to-[#FF4757]"
            bgGradient="from-red-50 via-rose-50 to-pink-50"
            subtitle={locale === 'ja' ? '調理中' : 'In kitchen'}
          />
          <SummaryCard
            title={t('stats.ready')}
            value={stats.readyOrders}
            icon="✅"
            gradient="from-[#31a354] to-[#31a354]"
            bgGradient="from-green-50 via-emerald-50 to-teal-50"
            subtitle={locale === 'ja' ? '提供準備完了' : 'Ready to serve'}
          />
        </div>

        {/* Revenue and Metrics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Revenue Card - Takes 2 columns */}
          <div className="lg:col-span-2 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-3xl shadow-2xl border-0 p-8 md:p-10 overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
              </div>
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <p className="text-base md:text-lg font-bold text-white/90 uppercase tracking-wider">{t('stats.revenue')}</p>
                  </div>
                  <p className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 drop-shadow-2xl">
                    ¥{stats.totalRevenue.toLocaleString()}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                      <p className="text-xs font-bold text-white/80 uppercase">{t('stats.avgOrder')}</p>
                      <p className="text-lg font-bold text-white">¥{averageOrderValue.toLocaleString()}</p>
                    </div>
                    <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                      <p className="text-xs font-bold text-white/80 uppercase">{t('stats.completion')}</p>
                      <p className="text-lg font-bold text-white">{completionRate}%</p>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-28 h-28 md:w-32 md:h-32 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-6xl md:text-7xl shadow-2xl border-4 border-white/40 animate-bounce-slow">
                    💰
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-lg animate-pulse">
                    ⭐
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-6 md:p-7 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{t('stats.performance')}</h3>
                <div className="w-10 h-10 bg-gradient-to-br from-[#31a354] to-[#31a354] rounded-xl flex items-center justify-center text-xl">
                  📊
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{t('stats.completion')}</span>
                    <span className="text-sm font-bold text-gray-900">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#31a354] to-[#31a354] rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{t('stats.activeOrders')}</span>
                    <span className="text-sm font-bold text-gray-900">{stats.pendingOrders + stats.preparingOrders + stats.readyOrders}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FFB800] to-[#FF9500] rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${stats.totalOrders > 0 ? Math.round(((stats.pendingOrders + stats.preparingOrders + stats.readyOrders) / stats.totalOrders) * 100) : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl shadow-xl border border-white/50 p-6 md:p-7 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{t('stats.quickStats')}</h3>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-xl text-white">
                  ⚡
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-600">{t('stats.totalOrders')}</span>
                  <span className="text-base font-bold text-gray-900">{stats.totalOrders}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-600">{t('stats.avgOrder')}</span>
                  <span className="text-base font-bold text-gray-900">¥{averageOrderValue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-600">{t('stats.completed')}</span>
                  <span className="text-base font-bold text-green-600">{stats.completedOrders}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-6 md:p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="w-2 h-10 bg-gradient-to-b from-[#31a354] to-[#31a354] rounded-full animate-pulse"></span>
              {t('recentOrders')}
            </h2>
            <div className="px-4 py-2 bg-gradient-to-r from-[#31a354] to-[#31a354] rounded-xl text-white text-sm font-bold shadow-lg">
              {recentOrders.length} {locale === 'ja' ? '件の最近の注文' : 'Recent'}
            </div>
          </div>
          {loading ? (
            <div className="text-center text-gray-500 py-20">
              <div className="inline-block relative">
                <div className="w-16 h-16 border-4 border-[#31a354]/20 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-[#31a354] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <p className="mt-6 text-gray-600 font-medium text-lg">{t('loadingOrders')}</p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-4xl">
                📭
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">{t('noRecentOrders')}</p>
              <p className="text-gray-500">{t('ordersWillAppear')}</p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-5">
              {recentOrders.map((order, index) => (
                <div
                  key={order._id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <RecentOrderItem
                    order={order}
                    timeAgo={getTimeAgo(order.createdAt)}
                    onClick={() => setSelectedOrder(order)}
                    t={t}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          timeAgo={getTimeAgo(selectedOrder.createdAt)}
          onClose={() => setSelectedOrder(null)}
          t={t}
          locale={locale}
        />
      )}
    </>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  gradient,
  bgGradient,
  trend,
  trendUp,
  subtitle,
}: {
  title: string;
  value: number;
  icon: string;
  gradient: string;
  bgGradient?: string;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
}) {
  return (
    <div className={`relative group bg-gradient-to-br ${bgGradient || "from-white to-gray-50"} rounded-3xl shadow-lg border border-white/50 p-6 md:p-7 active:scale-[0.97] transition-all duration-300 touch-manipulation min-h-[160px] md:min-h-[180px] flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 overflow-hidden`}>
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm md:text-base font-bold text-gray-600 uppercase tracking-wider">{title}</p>
            {trend && (
              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${trendUp
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
                }`}>
                {trendUp ? "↑" : "↓"} {trend}
              </span>
            )}
          </div>
          <p className="text-5xl md:text-6xl font-black text-gray-900 mb-2 bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm font-medium text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`relative bg-gradient-to-br ${gradient} rounded-2xl p-4 md:p-5 text-white text-3xl md:text-4xl shadow-xl backdrop-blur-sm min-w-[60px] min-h-[60px] md:min-w-[70px] md:min-h-[70px] flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
          <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
          <span className="relative z-10">{icon}</span>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="relative z-10 mt-auto">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${value > 0 ? Math.min((value / 50) * 100, 100) : 0}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

function RecentOrderItem({
  order,
  timeAgo,
  onClick,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t,
}: {
  order: Order;
  timeAgo: string;
  onClick: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    Received: {
      bg: "bg-[#E3F2FD]",
      text: "text-[#1976D2]",
      border: "border-[#1976D2]",
    },
    Preparing: {
      bg: "bg-[#FFF3E0]",
      text: "text-[#F57C00]",
      border: "border-[#F57C00]",
    },
    Ready: {
      bg: "bg-[#E8F5E9]",
      text: "text-[#31a354]",
      border: "border-[#31a354]",
    },
    Completed: {
      bg: "bg-[#E8F5E9]",
      text: "text-[#31a354]",
      border: "border-[#31a354]",
    },
  };

  const statusStyle = statusColors[order.status] || {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-300",
  };

  // Get gradient based on status
  const statusGradients: Record<string, string> = {
    Received: "from-blue-100 via-blue-50 to-cyan-50",
    Preparing: "from-orange-100 via-amber-50 to-yellow-50",
    Ready: "from-green-100 via-emerald-50 to-teal-50",
    Completed: "from-green-100 via-emerald-50 to-teal-50",
  };

  const cardGradient = statusGradients[order.status] || "from-gray-50 to-gray-100";

  return (
    <div
      className={`relative group bg-gradient-to-br ${cardGradient} border-2 border-white/50 rounded-2xl p-5 md:p-6 active:scale-[0.97] transition-all duration-300 cursor-pointer touch-manipulation backdrop-blur-sm hover:shadow-2xl hover:-translate-y-1 hover:border-white/80 overflow-hidden`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

      <div className="relative z-10">
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b-2 border-white/50 gap-3">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="font-bold text-gray-900 text-lg md:text-xl">{order.orderId}</span>
            <span className="text-base md:text-lg text-gray-600 font-medium">{t('table')} {order.tableNumber}</span>
            <span
              className={`text-sm md:text-base font-bold px-4 py-2 md:px-5 md:py-2.5 rounded-full border-2 shadow-sm ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} min-h-[44px] flex items-center`}
            >
              {order.status === 'Received' ? t('stats.pending') :
                order.status === 'Preparing' ? t('stats.preparing') :
                  order.status === 'Ready' ? t('stats.ready') :
                    order.status === 'Completed' ? t('stats.completed') : order.status}
            </span>
          </div>
          <div className="text-left sm:text-right bg-white/60 rounded-xl px-4 py-3 md:px-5 md:py-4 backdrop-blur-sm min-h-[60px] flex flex-col justify-center">
            <p className="text-sm md:text-base text-gray-500 font-medium">{timeAgo}</p>
            <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mt-1">
              ¥{order.total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Cart Items Preview */}
        <div className="space-y-3 md:space-y-4">
          {order.items.slice(0, 2).map((item, index) => {
            const itemTotal = item.quantity * item.price;
            return (
              <div
                key={`${item.itemId}-${index}`}
                className="flex items-center justify-between py-4 md:py-5 px-4 md:px-5 bg-white/70 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm min-h-[64px]"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <span className="text-base md:text-lg font-bold text-gray-900">
                      {item.name}
                    </span>
                    <span className="text-sm md:text-base text-gray-600 font-bold bg-gray-100 px-3 py-1.5 rounded-full min-h-[32px] flex items-center">
                      × {item.quantity}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm md:text-base text-gray-500 font-medium">
                    ¥{item.price.toLocaleString()} {t('stats.avgOrder').split(' ')[0]}
                  </div>
                  <div className="text-base md:text-lg font-bold text-gray-900 mt-1">
                    ¥{itemTotal.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
          {order.items.length > 2 && (
            <div className="text-sm md:text-base font-bold text-[#31a354] text-center py-4 md:py-5 bg-white/50 rounded-xl backdrop-blur-sm min-h-[56px] flex items-center justify-center">
              {t('moreItems', { count: order.items.length - 2 })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderDetailsModal({
  order,
  timeAgo,
  onClose,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t,
  locale,
}: {
  order: Order;
  timeAgo: string;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  locale: string;
}) {
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    Received: {
      bg: "bg-[#E3F2FD]",
      text: "text-[#1976D2]",
      border: "border-[#1976D2]",
    },
    Preparing: {
      bg: "bg-[#FFF3E0]",
      text: "text-[#F57C00]",
      border: "border-[#F57C00]",
    },
    Ready: {
      bg: "bg-[#E8F5E9]",
      text: "text-[#31a354]",
      border: "border-[#31a354]",
    },
    Completed: {
      bg: "bg-[#E8F5E9]",
      text: "text-[#31a354]",
      border: "border-[#31a354]",
    },
  };

  const statusStyle = statusColors[order.status] || {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-300",
  };

  // Format date and time
  const orderDate = new Date(order.createdAt).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const orderTime = new Date(order.createdAt).toLocaleTimeString(locale === 'ja' ? 'ja-JP' : 'en-US', {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Get gradient for modal content based on status
  const modalGradients: Record<string, string> = {
    Received: "from-blue-50 via-cyan-50 to-blue-50",
    Preparing: "from-orange-50 via-amber-50 to-yellow-50",
    Ready: "from-green-50 via-emerald-50 to-teal-50",
    Completed: "from-green-50 via-emerald-50 to-teal-50",
  };

  const contentGradient = modalGradients[order.status] || "from-gray-50 to-gray-100";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-md touch-manipulation"
      onClick={onClose}
    >
      <div
        className={`bg-gradient-to-br ${contentGradient} rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-white/50 backdrop-blur-sm touch-manipulation`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#31a354] via-[#31a354] to-[#31a354] px-6 md:px-8 py-6 md:py-7 flex items-center justify-between rounded-t-3xl shadow-lg z-10 min-h-[80px]">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">{t('orderDetails')}</h2>
            <p className="text-base md:text-lg text-white/95 mt-2 font-medium">{orderDate} {locale === 'ja' ? '' : 'at'} {orderTime}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/90 active:text-white transition-all duration-200 p-3 md:p-4 active:bg-white/30 rounded-full backdrop-blur-sm min-w-[48px] min-h-[48px] md:min-w-[56px] md:min-h-[56px] flex items-center justify-center touch-manipulation"
            aria-label={t('close')}
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
          {/* Order Info */}
          <div className="mb-8 pb-8 border-b-2 border-white/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-white/50 min-h-[80px] flex flex-col justify-center">
                <p className="text-sm md:text-base font-bold text-gray-600 uppercase tracking-wide">{t('orderId')}</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 mt-3">{order.orderId}</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-white/50 min-h-[80px] flex flex-col justify-center">
                <p className="text-sm md:text-base font-bold text-gray-600 uppercase tracking-wide">{t('table')}</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 mt-3">{t('table')} {order.tableNumber}</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-white/50 min-h-[80px] flex flex-col justify-center">
                <p className="text-sm md:text-base font-bold text-gray-600 uppercase tracking-wide">{t('customer')}</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 mt-3">{order.displayName}</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-white/50 min-h-[80px] flex flex-col justify-center">
                <p className="text-sm md:text-base font-bold text-gray-600 uppercase tracking-wide mb-3">{t('status')}</p>
                <span
                  className={`inline-block text-sm md:text-base font-bold px-4 py-2.5 md:px-5 md:py-3 rounded-full border-2 shadow-sm ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} min-h-[44px] flex items-center`}
                >
                  {order.status === 'Received' ? t('stats.pending') :
                    order.status === 'Preparing' ? t('stats.preparing') :
                      order.status === 'Ready' ? t('stats.ready') :
                        order.status === 'Completed' ? t('stats.completed') : order.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mt-5 md:mt-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-white/50 min-h-[70px] flex flex-col justify-center">
                <p className="text-sm md:text-base font-bold text-gray-600 uppercase tracking-wide">{t('paymentMethod')}</p>
                <p className="text-base md:text-lg text-gray-700 mt-3 font-bold">
                  {order.paymentMethod === 'paypay' ? 'PayPay' : order.paymentMethod === 'manual' ? (locale === 'ja' ? 'カウンター（手動）' : 'Manual (Counter)') : 'N/A'}
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-white/50 min-h-[70px] flex flex-col justify-center">
                <p className="text-sm md:text-base font-bold text-gray-600 uppercase tracking-wide mb-3">{t('paymentStatus')}</p>
                <span
                  className={`inline-block text-sm md:text-base font-bold px-4 py-2.5 md:px-5 md:py-3 rounded-full border-2 shadow-sm min-h-[44px] flex items-center ${order.paymentStatus === 'paid'
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : order.paymentStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                      : 'bg-gray-100 text-gray-800 border-gray-300'
                    }`}
                >
                  {order.paymentStatus === 'paid' ? (locale === 'ja' ? '支払い済み' : 'Paid') : order.paymentStatus === 'pending' ? (locale === 'ja' ? '保留中' : 'Pending') : 'N/A'}
                </span>
              </div>
            </div>
            <div className="mt-5 md:mt-6 bg-white/60 backdrop-blur-sm rounded-xl p-4 md:p-5 border border-white/50 min-h-[70px] flex flex-col justify-center">
              <p className="text-sm md:text-base font-bold text-gray-600 uppercase tracking-wide">{t('time')}</p>
              <p className="text-base md:text-lg text-gray-700 mt-3 font-bold">{timeAgo}</p>
            </div>
          </div>

          {/* Cart Items */}
          <div className="mb-8">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="w-1.5 h-7 bg-gradient-to-b from-[#31a354] to-[#31a354] rounded-full"></span>
              {t('orderItems')}
            </h3>
            <div className="space-y-4 md:space-y-5">
              {order.items.map((item, index) => {
                const itemTotal = item.quantity * item.price;
                return (
                  <div
                    key={`${item.itemId}-${index}`}
                    className="flex items-center justify-between py-5 md:py-6 px-5 md:px-6 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-white/70 transition-all duration-200 shadow-sm min-h-[80px]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4 md:gap-5">
                        <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#31a354] to-[#31a354] rounded-xl flex items-center justify-center text-base md:text-lg font-bold text-white shadow-lg border-2 border-white/30">
                          {item.quantity}
                        </div>
                        <div>
                          <p className="text-lg md:text-xl font-bold text-gray-900">{item.name}</p>
                          <p className="text-base md:text-lg text-gray-600 mt-1.5 font-medium">
                            ¥{item.price.toLocaleString()} × {item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg md:text-xl font-bold text-gray-900">
                        ¥{itemTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Total */}
          <div className="border-t-2 border-white/50 pt-6 md:pt-7 bg-white/40 backdrop-blur-sm rounded-xl p-5 md:p-6 border border-white/50 min-h-[80px] flex items-center">
            <div className="flex items-center justify-between w-full">
              <span className="text-2xl md:text-3xl font-bold text-gray-900">{t('total')}</span>
              <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#31a354] to-[#31a354] bg-clip-text text-transparent drop-shadow-sm">
                ¥{order.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gradient-to-r from-white/90 to-white/80 backdrop-blur-md border-t-2 border-white/50 px-6 md:px-8 py-5 md:py-6 flex justify-end rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-10 md:px-12 py-4 md:py-5 bg-gradient-to-r from-[#31a354] to-[#31a354] text-white rounded-xl active:shadow-xl transition-all duration-200 font-bold text-lg md:text-xl active:scale-95 shadow-lg border-2 border-white/30 min-h-[56px] md:min-h-[64px] min-w-[120px] md:min-w-[140px] flex items-center justify-center touch-manipulation"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}


