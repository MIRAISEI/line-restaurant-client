"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getOrders } from "@/lib/admin-api";

export default function AdminNavigation() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLanguageToggle = () => {
    const nextLocale = locale === 'en' ? 'ja' : 'en';
    router.replace(pathname, { locale: nextLocale });
  };

  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const orders = await getOrders();
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);

        // Count recent orders (last 24 hours) as unread notifications
        const recentCount = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= oneDayAgo;
        }).length;

        setUnreadCount(recentCount);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    }

    if (user) {
      fetchUnreadCount();
      // Refresh count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  return (
    <nav className="bg-gradient-to-r from-white via-blue-50 to-purple-50 border-b border-white/50 shadow-lg sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 md:h-24">
          <div className="flex items-center w-full">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#06C755] via-[#00C300] to-[#06C755] bg-clip-text text-transparent drop-shadow-sm">
                Miraisei Demo Admin
              </h1>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-3 md:space-x-4 flex-1">
              <NavLink href="/admin" pathname={pathname}>
                {t('dashboard')}
              </NavLink>
              <NavLink href="/admin/orders" pathname={pathname}>
                {t('orders')}
              </NavLink>
              <NavLink href="/admin/menu" pathname={pathname}>
                {t('menu')}
              </NavLink>
              {(user?.role === "admin" || user?.role === "manager") && (
                <NavLink href="/admin/users" pathname={pathname}>
                  {t('users')}
                </NavLink>
              )}
              <NavLink href="/admin/profile" pathname={pathname}>
                {t('profile')}
              </NavLink>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <>
                  {/* Notification Icon */}
                  <Link
                    href="/admin/notifications"
                    className="relative p-2 text-gray-600 hover:text-[#06C755] transition-colors duration-200 rounded-lg hover:bg-white/50 active:scale-95 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={t('notifications')}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {/* Badge - shows unread count */}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-lg">
                        {unreadCount > 9 ? "9+" : unreadCount}
                        <span className="sr-only">{unreadCount} {t('unreadNotifications')}</span>
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/admin/profile"
                    className="hidden sm:flex items-center gap-2 text-sm text-gray-600 font-medium hover:text-[#06C755] transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-white/50"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#06C755] to-[#00C300] flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold">{user.displayName}</span>
                      <span className="text-xs text-gray-500">{user.role}</span>
                    </div>
                  </Link>
                </>
              )}

              <button
                onClick={handleLanguageToggle}
                className="p-2 text-gray-600 hover:text-[#06C755] transition-colors duration-200 rounded-lg hover:bg-white/50 active:scale-95 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center font-bold"
                aria-label="Toggle Language"
              >
                {locale === 'en' ? 'JP' : 'EN'}
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all duration-200 active:scale-95 touch-manipulation min-h-[44px] flex items-center gap-2"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Navigation */}
      <div className="sm:hidden border-t border-white/50 bg-gradient-to-b from-blue-50 to-purple-50 backdrop-blur-sm">
        <div className="px-3 pt-3 pb-4 space-y-2">
          <MobileNavLink href="/admin" pathname={pathname}>
            {t('dashboard')}
          </MobileNavLink>
          <MobileNavLink href="/admin/orders" pathname={pathname}>
            {t('orders')}
          </MobileNavLink>
          <MobileNavLink href="/admin/menu" pathname={pathname}>
            {t('menu')}
          </MobileNavLink>
          {(user?.role === "admin" || user?.role === "manager") && (
            <MobileNavLink href="/admin/users" pathname={pathname}>
              {t('users')}
            </MobileNavLink>
          )}
          <MobileNavLink href="/admin/profile" pathname={pathname}>
            {t('profile')}
          </MobileNavLink>
          <MobileNavLink href="/admin/notifications" pathname={pathname}>
            🔔 {t('notifications')}
          </MobileNavLink>
          {user && (
            <Link
              href="/admin/profile"
              className="px-5 py-4 text-sm text-gray-600 font-medium border-t border-white/50 flex items-center gap-3 hover:bg-white/50 transition-colors duration-200"
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#06C755] to-[#00C300] flex items-center justify-center text-white font-bold shadow-md">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-bold">{user.displayName}</span>
                <span className="text-xs text-gray-500">{user.role}</span>
              </div>
            </Link>
          )}

          <button
            onClick={handleLanguageToggle}
            className="w-full px-5 py-4 text-gray-700 hover:bg-white/50 rounded-xl font-bold transition-all duration-200 active:scale-95 touch-manipulation min-h-[56px] flex items-center gap-3 border-t border-white/50"
          >
            <span className="text-xl">🌐</span>
            <span>{locale === 'en' ? '日本語に切り替え' : 'Switch to English'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full px-5 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all duration-200 active:scale-95 touch-manipulation min-h-[56px] flex items-center justify-center gap-2 mt-2"
          >
            <span>🚪</span>
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
  pathname,
}: {
  href: string;
  children: React.ReactNode;
  pathname: string | null;
}) {
  const isActive =
    pathname === href || (href !== "/admin" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`inline-flex items-center px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-sm md:text-base font-bold transition-all duration-200 touch-manipulation active:scale-95 min-h-[40px] md:min-h-[44px] ${isActive
        ? "bg-gradient-to-r from-[#06C755] to-[#00C300] text-white shadow-lg active:shadow-xl"
        : "text-gray-700 active:text-gray-900 active:bg-white/70 backdrop-blur-sm border border-white/50"
        }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  pathname,
}: {
  href: string;
  children: React.ReactNode;
  pathname: string | null;
}) {
  const isActive =
    pathname === href || (href !== "/admin" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`block px-5 py-3 rounded-xl text-base font-bold transition-all duration-200 touch-manipulation active:scale-95 min-h-[48px] flex items-center ${isActive
        ? "bg-gradient-to-r from-[#06C755] to-[#00C300] text-white shadow-lg active:shadow-xl"
        : "text-gray-700 active:bg-white active:text-gray-900"
        }`}
    >
      {children}
    </Link>
  );
}


